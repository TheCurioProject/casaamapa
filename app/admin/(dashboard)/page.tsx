export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminDashboardClient } from './dashboard-client';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    where: { checkOut: { gte: new Date() } },
    orderBy: { checkIn: 'asc' },
    include: { unit: true },
    take: 20
  });

  const blockedDates = await prisma.blockedDate.findMany({
    where: { endDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    include: { unit: true },
    take: 20
  });

  const webBookings = bookings.filter(b => !b.isManual);
  const manualBookings = bookings.filter(b => b.isManual);
  const otaBlocks = blockedDates.filter(b => b.isOtaBlock);
  const manualBlocks = blockedDates.filter(b => !b.isOtaBlock);

  const [totalBookings, totalRevenue, units, webBookingsCount, manualBookingsCount, otaBlocksCount, manualBlocksCount] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { totalPrice: true } }),
    prisma.unit.findMany(),
    prisma.booking.count({ where: { isManual: false } }),
    prisma.booking.count({ where: { isManual: true } }),
    prisma.blockedDate.count({ where: { isOtaBlock: true } }),
    prisma.blockedDate.count({ where: { isOtaBlock: false } })
  ]);

  const stats = {
    total: totalBookings,
    revenue: totalRevenue._sum.totalPrice || 0,
    units: units.length,
    webBookingsCount,
    manualBookingsCount,
    otaBlocksCount,
    manualBlocksCount
  };

  return (
    <AdminDashboardClient 
      stats={stats} 
      webBookings={webBookings}
      manualBookings={manualBookings}
      otaBlocks={otaBlocks}
      manualBlocks={manualBlocks}
    />
  );
}
