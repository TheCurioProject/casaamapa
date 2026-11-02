import type { Booking, BlockedDate, Unit } from '@prisma/client';
export type AdminBooking = Booking & { unit?: Pick<Unit, 'name' | 'price'> | null };
export type AdminBlock = BlockedDate & { unit?: Pick<Unit, 'name' | 'price'> | null };
