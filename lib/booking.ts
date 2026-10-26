import type { Prisma } from '@prisma/client';
import type { ExtTxClient } from '@/lib/db';

export const ACTIVE_BOOKING_STATUSES = ['pending', 'processing', 'confirmed', 'attention_required'] as const;
export const CONFIRMED_BOOKING_STATUSES = ['confirmed', 'attention_required'] as const;
export const CHECKOUT_HOLD_MINUTES = 30;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingValidationError';
  }
}

export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (!match) throw new BookingValidationError('La fecha no tiene un formato válido.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BookingValidationError('La fecha seleccionada no existe.');
  }

  return date;
}

export function toDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

export function validateStay(checkIn: Date, checkOut: Date) {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new BookingValidationError('La estancia debe ser de al menos una noche.');
  if (nights > 90) throw new BookingValidationError('La estancia no puede superar 90 noches.');

  const today = new Date();
  const todayDate = parseDateOnly(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  );
  if (checkIn < todayDate) throw new BookingValidationError('La fecha de llegada ya pasó.');
}

export function activeBookingWhere(now = new Date()): Prisma.BookingWhereInput {
  const legacyCutoff = new Date(now.getTime() - CHECKOUT_HOLD_MINUTES * 60 * 1000);
  return {
    OR: [
      { status: { in: ['processing', 'confirmed', 'attention_required'] } },
      { status: 'pending', expiresAt: { gt: now } },
      { status: 'pending', expiresAt: null, createdAt: { gt: legacyCutoff } },
    ],
  };
}

async function relatedUnitIds(tx: ExtTxClient, apartmentId: string) {
  const target = await tx.unit.findUnique({
    where: { id: apartmentId },
    select: { id: true, isWholeHouse: true },
  });
  if (!target) throw new BookingValidationError('El alojamiento seleccionado no existe.');

  if (target.isWholeHouse) {
    return (await tx.unit.findMany({ select: { id: true } })).map((unit) => unit.id);
  }

  const wholeHouseIds = await tx.unit.findMany({
    where: { isWholeHouse: true },
    select: { id: true },
  });
  return [target.id, ...wholeHouseIds.map((unit) => unit.id)];
}

export async function lockAndAssertAvailability(
  tx: ExtTxClient,
  input: { apartmentId: string; checkIn: Date; checkOut: Date; excludeBookingId?: string },
) {
  // One property-wide transaction lock also serializes whole-house vs sub-unit
  // reservations, a case a normal per-unit exclusion constraint cannot cover.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(184247931)`;

  const ids = await relatedUnitIds(tx, input.apartmentId);
  const now = new Date();
  const [booking, block] = await Promise.all([
    tx.booking.findFirst({
      where: {
        id: input.excludeBookingId ? { not: input.excludeBookingId } : undefined,
        apartmentId: { in: ids },
        AND: [
          activeBookingWhere(now),
          { checkIn: { lt: input.checkOut } },
          { checkOut: { gt: input.checkIn } },
        ],
      },
      select: { id: true },
    }),
    tx.blockedDate.findFirst({
      where: {
        apartmentId: { in: ids },
        startDate: { lt: input.checkOut },
        endDate: { gte: input.checkIn },
      },
      select: { id: true },
    }),
  ]);

  if (booking || block) {
    throw new BookingValidationError('Las fechas seleccionadas ya no están disponibles.');
  }
}

export async function calculateBookingQuote(
  tx: ExtTxClient,
  apartmentId: string,
  checkIn: Date,
  checkOut: Date,
) {
  const unit = await tx.unit.findUnique({ where: { id: apartmentId } });
  if (!unit) throw new BookingValidationError('El alojamiento seleccionado no existe.');

  const dailyPrices = await tx.dailyPrice.findMany({
    where: { apartmentId, date: { gte: checkIn, lt: checkOut } },
    select: { date: true, price: true },
  });
  const priceByDate = new Map(dailyPrices.map((item) => [toDateOnly(item.date), item.price]));
  const nights = nightsBetween(checkIn, checkOut);
  let totalPrice = 0;

  for (let index = 0; index < nights; index += 1) {
    const date = addDays(checkIn, index);
    const basePrice = priceByDate.get(toDateOnly(date)) ?? unit.price;
    totalPrice += unit.addStripeCommission ? Math.round(basePrice * 1.05) : basePrice;
  }

  // Public website reservations are always paid in full. The deposit settings
  // belong exclusively to manual/admin reservations and must never affect Stripe.
  const depositPercentage = 100;
  const paymentAmountCents = calculateWebsitePaymentAmountCents(totalPrice);

  if (paymentAmountCents < 1) throw new BookingValidationError('No se pudo calcular un monto de pago válido.');

  return { unit, nights, totalPrice, depositPercentage, paymentAmountCents };
}

export function calculateWebsitePaymentAmountCents(totalPrice: number) {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new BookingValidationError('No se pudo calcular un monto de pago válido.');
  }
  return Math.round(totalPrice * 100);
}
