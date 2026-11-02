import test from 'node:test';
import assert from 'node:assert/strict';
import { retrySerializableTransaction } from '../lib/booking-transaction';

test('a serialization conflict retries the complete reservation operation', async () => {
  let attempts = 0;
  let validations = 0;
  const operation = async () => {
    validations += 1;
    attempts += 1;
    if (attempts < 3) throw { code: 'P2034' };
    return 'confirmed';
  };
  assert.equal(await retrySerializableTransaction(operation), 'confirmed');
  assert.equal(attempts, 3);
  assert.equal(validations, 3);
});

test('retries stop after three attempts and never retry validation or connection errors', async () => {
  for (const code of ['P2034', 'P2002', 'P1001']) {
    let attempts = 0;
    await assert.rejects(retrySerializableTransaction(async () => { attempts += 1; throw { code }; }), error => (error as { code: string }).code === code);
    assert.equal(attempts, code === 'P2034' ? 3 : 1);
  }
});
