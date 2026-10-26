import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 3),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter }).$extends({
    result: {
      booking: {
        checkIn: {
          needs: { checkIn: true },
          compute(b) { return new Date(b.checkIn.getTime() + 12 * 60 * 60 * 1000); }
        },
        checkOut: {
          needs: { checkOut: true },
          compute(b) { return new Date(b.checkOut.getTime() + 12 * 60 * 60 * 1000); }
        }
      },
      blockedDate: {
        startDate: {
          needs: { startDate: true },
          compute(b) { return new Date(b.startDate.getTime() + 12 * 60 * 60 * 1000); }
        },
        endDate: {
          needs: { endDate: true },
          compute(b) { return new Date(b.endDate.getTime() + 12 * 60 * 60 * 1000); }
        }
      },
      dailyPrice: {
        date: {
          needs: { date: true },
          compute(b) { return new Date(b.date.getTime() + 12 * 60 * 60 * 1000); }
        }
      }
    }
  });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;
export type ExtTxClient = Omit<ExtendedPrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as ExtendedPrismaClient;

globalForPrisma.prisma = prisma;
