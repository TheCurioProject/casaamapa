import test from 'node:test';
import assert from 'node:assert/strict';
import { activeBookingWhere, lockAndAssertAvailability, parseDateOnly, validateDateRange, validateStay } from '../lib/booking';
import { calendarDate, calendarDateKey } from '../lib/calendar-dates';
import { isSerializationFailure } from '../lib/booking-transaction';

const stay = { apartmentId: 'tierra', checkIn: parseDateOnly('2030-01-10'), checkOut: parseDateOnly('2030-01-12') };
function availabilityFixture({ wholeHouse = false, booking = false, block = false } = {}) {
  const calls: string[] = [];
  let bookingFilter: unknown;
  const tx = {
    $queryRaw: async () => { calls.push('lock'); return [{ pg_advisory_xact_lock: '' }]; },
    unit: {
      findUnique: async () => { calls.push('unit'); return { id: wholeHouse ? 'amapa' : 'tierra', isWholeHouse: wholeHouse }; },
      findMany: async ({ where }: { where?: unknown } = {}) => where ? [{ id: 'amapa' }] : [{ id: 'tierra' }, { id: 'agua' }, { id: 'aire' }, { id: 'amapa' }],
    },
    booking: { findFirst: async (query: unknown) => { bookingFilter = query; return booking ? { id: 'existing' } : null; } },
    blockedDate: { findFirst: async () => block ? { id: 'existing' } : null },
  };
  return { tx, calls, bookingFilter: () => JSON.stringify(bookingFilter) };
}

test('availability locks the property before checking dates and includes whole-house reservations', async () => {
  const fixture = availabilityFixture();
  await lockAndAssertAvailability(fixture.tx as never, stay);
  assert.deepEqual(fixture.calls, ['lock', 'unit']);
  assert.match(fixture.bookingFilter(), /amapa/);
  assert.match(fixture.bookingFilter(), /tierra/);
  assert.doesNotMatch(fixture.bookingFilter(), /agua/);
});

test('whole-house availability checks every apartment', async () => {
  const fixture = availabilityFixture({ wholeHouse: true });
  await lockAndAssertAvailability(fixture.tx as never, { ...stay, apartmentId: 'amapa' });
  for (const id of ['tierra', 'agua', 'aire', 'amapa']) assert.match(fixture.bookingFilter(), new RegExp(id));
});

test('existing bookings and manual/OTA blocks prevent a second reservation', async () => {
  for (const state of [{ booking: true }, { block: true }]) {
    await assert.rejects(lockAndAssertAvailability(availabilityFixture(state).tx as never, stay), /no están disponibles/);
  }
});

test('editing excludes only the edited reservation from overlap checks', async () => {
  const fixture = availabilityFixture();
  await lockAndAssertAvailability(fixture.tx as never, { ...stay, excludeBookingId: 'edited' });
  assert.match(fixture.bookingFilter(), /"id":\{"not":"edited"\}/);
});

test('zero-night, reversed, and invalid ranges fail before querying the database', async () => {
  const fixture = availabilityFixture();
  for (const checkOut of [stay.checkIn, parseDateOnly('2030-01-09'), new Date('invalid')]) {
    await assert.rejects(lockAndAssertAvailability(fixture.tx as never, { ...stay, checkOut }));
  }
  assert.deepEqual(fixture.calls, []);
  assert.throws(() => validateDateRange(new Date('invalid'), stay.checkOut), /fechas válidas/);
  assert.throws(() => validateStay(stay.checkIn, parseDateOnly('2030-05-10')), /90 noches/);
});

test('pending dates remain held until Stripe has been reconciled, matching the SQL constraint', () => {
  assert.deepEqual(activeBookingWhere(), { status: { in: ['pending', 'processing', 'confirmed', 'attention_required'] } });
});

test('calendar dates round-trip independently of the device timezone', () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const zone of ['America/Mazatlan', 'America/Mexico_City', 'America/Los_Angeles', 'Pacific/Auckland', 'Asia/Tokyo']) {
      process.env.TZ = zone;
      const localSelection = new Date(2030, 0, 10);
      assert.equal(calendarDateKey(localSelection), '2030-01-10');
      assert.equal(calendarDateKey(calendarDate('2030-01-10T12:00:00.000Z')), '2030-01-10');
      assert.equal(calendarDateKey(calendarDate(parseDateOnly('2030-01-10'))), '2030-01-10');
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test('only serialization errors are eligible for transaction retries', () => {
  assert.equal(isSerializationFailure({ code: 'P2034' }), true);
  assert.equal(isSerializationFailure({ meta: { driverAdapterError: { cause: { originalCode: '40001' } } } }), true);
  assert.equal(isSerializationFailure({ code: 'P2002' }), false);
  assert.equal(isSerializationFailure(new Error('connection lost')), false);
});
