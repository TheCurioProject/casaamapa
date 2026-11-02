import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// @db.Date is a calendar date, not an instant. Noon UTC keeps existing display
// conventions while remaining idempotent if a computed result is read twice.
const dateAtNoon = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));

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
          compute(b) { return dateAtNoon(b.checkIn); }
        },
        checkOut: {
          needs: { checkOut: true },
          compute(b) { return dateAtNoon(b.checkOut); }
        }
      },
      blockedDate: {
        startDate: {
          needs: { startDate: true },
          compute(b) { return dateAtNoon(b.startDate); }
        },
        endDate: {
          needs: { endDate: true },
          compute(b) { return dateAtNoon(b.endDate); }
        }
      },
      dailyPrice: {
        date: {
          needs: { date: true },
          compute(b) { return dateAtNoon(b.date); }
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
