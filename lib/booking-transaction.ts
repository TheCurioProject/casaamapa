import { prisma, type ExtTxClient } from '@/lib/db';

export async function withBookingTransaction<T>(operation: (tx: ExtTxClient) => Promise<T>): Promise<T> {
  return retrySerializableTransaction(() => prisma.$transaction(operation, {
    isolationLevel: 'Serializable', maxWait: 5_000, timeout: 10_000,
  }));
}

export async function retrySerializableTransaction<T>(operation: () => Promise<T>): Promise<T> {
  // Serializable transactions can be aborted when concurrent reservations wait
  // for the property lock. Re-run the complete validation on a fresh snapshot.
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= 2 || !isSerializationFailure(error)) throw error;
      await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }
}

export function isSerializationFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const failure = error as { code?: string; meta?: { driverAdapterError?: { cause?: { originalCode?: string } } } };
  return failure.code === 'P2034' || failure.meta?.driverAdapterError?.cause?.originalCode === '40001';
}
