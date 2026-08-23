import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const createPrismaClient = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter }).$extends({
    result: {
      blockedDate: {
        startDate: {
          needs: { startDate: true },
          compute(b) { return new Date(b.startDate.getTime() + 12 * 60 * 60 * 1000); }
        }
      }
    }
  });
};

type ExtendedClient = ReturnType<typeof createPrismaClient>;
type TxClient = Parameters<Parameters<ExtendedClient['$transaction']>[0]>[0];

const prisma = createPrismaClient();

async function main() {
  await prisma.$transaction(async (tx: TxClient) => {
    const block = await tx.blockedDate.findFirst();
    console.log("Block inside tx:", block);
  });
}
main().catch(console.error);
