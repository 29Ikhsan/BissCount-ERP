import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  return NextResponse.json({ 
    modelKeys: keys,
    hasEmployee: 'employee' in prisma,
    hasBOMItem: 'bOMItem' in prisma || 'bomItem' in prisma,
    env: process.env.NODE_ENV
  });
}
