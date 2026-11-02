import test from 'node:test';
import assert from 'node:assert/strict';
import { plainData } from '../lib/plain-data';
import { propertyDateKey, propertyCalendarDate, calendarDateKey } from '../lib/calendar-dates';

test('Prisma-like inspection symbols are removed recursively while Dates remain Dates', () => {
  const inspect = Symbol.for('nodejs.util.inspect.custom');
  const date = new Date('2030-01-10T12:00:00.000Z');
  const source = { checkIn: date, nested: [{ price: 4000, [inspect]: () => 'model' }], [inspect]: () => 'model' };
  const result = plainData(source);
  assert.deepEqual(Object.getOwnPropertySymbols(result), []);
  assert.deepEqual(Object.getOwnPropertySymbols(result.nested[0]), []);
  assert.ok(result.checkIn instanceof Date);
  assert.equal(result.checkIn.toISOString(), date.toISOString());
  assert.notEqual(result.checkIn, source.checkIn);
  assert.equal(Object.getOwnPropertySymbols(source).length, 1);
});

test('property today and timestamp labels are stable across midnight in visitor timezones', () => {
  const instant = new Date('2026-11-03T05:30:00.000Z');
  assert.equal(propertyDateKey(instant), '2026-11-02');
  const originalTimezone = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Pacific/Auckland', 'America/Los_Angeles']) {
      process.env.TZ = zone;
      assert.equal(propertyDateKey(instant), '2026-11-02');
      assert.equal(calendarDateKey(propertyCalendarDate(instant)), '2026-11-02');
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
