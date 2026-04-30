import { PrismaClient } from '../generated/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClientSingleton | undefined
}

// Force refresh of prisma instance to pick up new models
export const prisma = globalForPrisma.prisma_v3 ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v3 = prisma
