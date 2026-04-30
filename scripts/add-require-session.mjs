#!/usr/bin/env node
/**
 * One-shot codemod: insert `requireSession()` guard at the top of every
 * exported HTTP handler in src/app/api/** that does not already perform
 * a session check.
 *
 * Idempotent: skips files/handlers that already reference requireSession,
 * requireAdminSession, checkAdminAccess or getServerSession.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const API_DIR = path.join(ROOT, 'src', 'app', 'api');

// Routes that should NOT be touched by this codemod.
const SKIP = new Set([
  // NextAuth itself.
  path.join(API_DIR, 'auth', '[...nextauth]', 'route.ts'),
]);

const HANDLER_RE =
  /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(([^)]*)\)\s*(?::\s*[^\{]+?)?\s*\{/g;

const GUARD_LINES = [
  '  const __auth = await requireSession();',
  '  if (!__auth.ok) return __auth.response;',
];

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name === 'route.ts') yield full;
  }
}

function ensureImport(src) {
  if (/from\s+['"]@\/lib\/access-server['"]/.test(src)) {
    if (/requireSession/.test(src)) return src;
    return src.replace(
      /import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]@\/lib\/access-server['"]\s*;?/,
      (_m, names) => {
        const set = new Set(names.split(',').map((s) => s.trim()).filter(Boolean));
        set.add('requireSession');
        return `import { ${Array.from(set).join(', ')} } from '@/lib/access-server';`;
      },
    );
  }
  // Insert after the last import line.
  const importRe = /^(?:import[^\n]*\n)+/m;
  const importBlock = src.match(importRe);
  const line = `import { requireSession } from '@/lib/access-server';\n`;
  if (importBlock) {
    return src.replace(importRe, importBlock[0] + line);
  }
  return line + src;
}

function injectGuards(src) {
  // We mutate via sequential regex; reset lastIndex by reassigning matches array.
  const matches = [...src.matchAll(HANDLER_RE)];
  if (matches.length === 0) return { src, changed: false };

  let out = '';
  let cursor = 0;
  let changed = false;

  for (const m of matches) {
    const headerEnd = m.index + m[0].length;
    out += src.slice(cursor, headerEnd);

    // Look ahead inside the function body until we find a non-blank line.
    // Skip injection if a session guard already exists in the first ~20 lines.
    const lookahead = src.slice(headerEnd, headerEnd + 1500);
    if (/requireSession\s*\(|getServerSession\s*\(|checkAdminAccess\s*\(/.test(lookahead)) {
      cursor = headerEnd;
      continue;
    }

    // Insert guard immediately after the opening brace, on its own line(s).
    out += '\n' + GUARD_LINES.join('\n') + '\n';
    cursor = headerEnd;
    changed = true;
  }

  out += src.slice(cursor);
  return { src: out, changed };
}

async function processFile(file) {
  const orig = await fs.readFile(file, 'utf8');
  const { src: injected, changed } = injectGuards(orig);
  if (!changed) return false;
  const finalSrc = ensureImport(injected);
  await fs.writeFile(file, finalSrc);
  return true;
}

(async () => {
  let touched = 0;
  for await (const file of walk(API_DIR)) {
    if (SKIP.has(file)) continue;
    const did = await processFile(file);
    if (did) {
      touched++;
      console.log('updated', path.relative(ROOT, file));
    }
  }
  console.log(`\nDone. ${touched} file(s) updated.`);
})();
