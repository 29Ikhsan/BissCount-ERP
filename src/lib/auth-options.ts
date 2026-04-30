import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is not set. Refusing to start with an insecure default.")
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          permissions: user.permissions
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.permissions = (user as any).permissions
      }

      // On client-triggered update(), re-read role/tenant from the DB.
      // Never trust values supplied by the client session payload — the
      // previous implementation let any caller inject `permissions` here.
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, tenantId: true },
        })
        if (fresh) {
          token.role = fresh.role
          token.tenantId = fresh.tenantId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).permissions = token.permissions;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: nextAuthSecret,
}
