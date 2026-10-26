import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  calculateBookingQuote,
  calculateWebsitePaymentAmountCents,
  nightsBetween,
  parseDateOnly,
  toDateOnly,
} from '../lib/booking';
import { parseIcalBlocks } from '../lib/ical-sync';
import { getInvoiceHtml } from '../lib/invoice-template';
import { shouldPreserveSettledBooking } from '../lib/payment-processing';

test('date-only booking math preserves a one-night stay', () => {
  const checkIn = parseDateOnly('2030-01-10');
  const checkOut = addDays(checkIn, 1);
  assert.equal(toDateOnly(checkOut), '2030-01-11');
  assert.equal(nightsBetween(checkIn, checkOut), 1);
});

test('invalid calendar dates are rejected', () => {
  assert.throws(() => parseDateOnly('2030-02-30'), /no existe/);
  assert.throws(() => parseDateOnly('01-10-2030'), /formato/);
});

test('iCal DTEND is converted from exclusive to inclusive exactly once', () => {
  const text = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'UID:ota-123@example.com',
    'DTSTART;VALUE=DATE:20300110',
    'DTEND;VALUE=DATE:20300113',
    'SUMMARY:Reserved',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blocks = parseIcalBlocks(text, 'tierra', 'https://calendar.example.com/feed.ics');
  assert.equal(blocks.length, 1);
  assert.equal(toDateOnly(blocks[0].startDate), '2030-01-10');
  assert.equal(toDateOnly(blocks[0].endDate), '2030-01-12');
});

test('iCal import ignores Casa Amapa exports to prevent loops', () => {
  const text = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'UID:booking-1@casaamapa.com',
    'DTSTART;VALUE=DATE:20300110',
    'DTEND;VALUE=DATE:20300111',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  assert.equal(parseIcalBlocks(text, 'tierra', 'https://calendar.example.com/feed.ics').length, 0);
});

test('website checkout always charges the full quoted amount', () => {
  assert.equal(calculateWebsitePaymentAmountCents(4200), 420000);
  assert.throws(() => calculateWebsitePaymentAmountCents(0), /monto de pago válido/);
});

test('website quote ignores manual deposit settings and persists 100%', async () => {
  const tx = {
    unit: {
      findUnique: async () => ({ id: 'tierra', price: 2000, addStripeCommission: false }),
    },
    dailyPrice: {
      findMany: async () => [],
    },
    settings: {
      findUnique: async () => {
        throw new Error('Manual settings must not be queried by website checkout');
      },
    },
  };

  const quote = await calculateBookingQuote(
    tx as never,
    'tierra',
    parseDateOnly('2030-01-10'),
    parseDateOnly('2030-01-12'),
  );

  assert.equal(quote.totalPrice, 4000);
  assert.equal(quote.depositPercentage, 100);
  assert.equal(quote.paymentAmountCents, 400000);
});

test('late Stripe events cannot downgrade a settled booking', () => {
  assert.equal(shouldPreserveSettledBooking('confirmed', 'processing'), true);
  assert.equal(shouldPreserveSettledBooking('confirmed', 'requires_payment_method'), true);
  assert.equal(shouldPreserveSettledBooking('attention_required', 'canceled'), true);
  assert.equal(shouldPreserveSettledBooking('pending', 'processing'), false);
  assert.equal(shouldPreserveSettledBooking('confirmed', 'succeeded'), false);
});

test('invoice escapes guest input and displays a manual deposit balance', () => {
  const html = getInvoiceHtml({
    id: 'booking-id',
    guestName: '<script>alert(1)</script>',
    checkIn: parseDateOnly('2030-01-10'),
    checkOut: parseDateOnly('2030-01-12'),
    guests: 2,
    isManual: true,
    totalPrice: 4000,
    depositPercentage: 50,
    paymentAmountCents: 200000,
    amountPaidCents: 200000,
    paymentBrand: 'visa',
    paymentLast4: '4242',
    unit: { name: 'Tierra' },
  });
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
  assert.match(html, /Resto a Pagar/);
  assert.match(html, /2,000/);
});
