// Read-only integration check. Run explicitly with npm run test:db against the
// configured PostgreSQL. It acquires a transaction lock and never writes rows.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../lib/db';
import { lockAndAssertAvailability, parseDateOnly } from '../../lib/booking';

test('real PostgreSQL advisory lock is readable by Prisma and permits availability checks', async () => {
  try {
    await prisma.$transaction(async tx => {
      const fixture = {
        $queryRaw: tx.$queryRaw.bind(tx),
        unit: {
          findUnique: async () => ({ id: 'tierra', isWholeHouse: false }),
          findMany: async () => [{ id: 'amapa' }],
        },
        booking: { findFirst: async () => null },
        blockedDate: { findFirst: async () => null },
      };
      await assert.doesNotReject(lockAndAssertAvailability(fixture as never, {
        apartmentId: 'tierra', checkIn: parseDateOnly('2030-01-10'), checkOut: parseDateOnly('2030-01-12'),
      }));
    });
  } finally {
    await prisma.$disconnect();
  }
});
