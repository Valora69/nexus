import { PrismaClient } from '@prisma/client';

// Serverless-safe singleton: reuse the PrismaClient across warm lambda
// invocations to avoid opening a new connection pool on every request.
// In development, Next.js HMR clears module-level state but keeps globalThis,
// so caching here prevents connection leaks during rapid reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log slow queries in development for debugging.
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Cache unconditionally — warm lambdas reuse the same process, and dev
// HMR needs the cache to prevent leaked connections.
globalForPrisma.prisma = prisma;
