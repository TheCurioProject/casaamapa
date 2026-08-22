import { prisma } from '@/lib/db';
import { PricingCalendar } from '@/components/admin/pricing-calendar';
import { getPricesForDateRange } from '@/app/actions/prices';
import { startOfMonth, addMonths, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminPricesPage() {
  const units = await prisma.unit.findMany({
    orderBy: { name: 'asc' },
  });

  // Get data for a broad range since calendar might move
  const today = new Date();
  const startDate = subMonths(startOfMonth(today), 3);
  const endDate = addMonths(startOfMonth(today), 12);

  const bookings = await prisma.booking.findMany({
    where: {
      checkOut: { gte: startDate },
      checkIn: { lte: endDate },
      status: { not: 'cancelled' },
    },
  });

  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      endDate: { gte: startDate },
      startDate: { lte: endDate },
    },
  });

  const dailyPrices = await getPricesForDateRange(startDate, endDate);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-[var(--color-ink)] mb-2">Precios</h1>
        <p className="text-[var(--color-ink)] opacity-70">Ajusta los precios por fecha para cada unidad.</p>
      </div>

      <PricingCalendar 
        units={units} 
        bookings={bookings} 
        blockedDates={blockedDates} 
        dailyPrices={dailyPrices} 
      />
    </div>
  );
}
