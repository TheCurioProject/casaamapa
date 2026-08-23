export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminDashboardClient } from './dashboard-client';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { unit: true },
    take: 20
  });

  const blockedDates = await prisma.blockedDate.findMany({
    orderBy: { createdAt: 'desc' },
    include: { unit: true },
    take: 20
  });

  const webBookings = bookings.filter(b => !b.isManual);
  const manualBookings = bookings.filter(b => b.isManual);
  const otaBlocks = blockedDates.filter(b => b.isOtaBlock);
  const manualBlocks = blockedDates.filter(b => !b.isOtaBlock);

  const units = await prisma.unit.findMany();

  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((acc: any, curr: any) => acc + (curr.unit?.price || 0), 0),
    units: units.length,
    webBookingsCount: webBookings.length,
    manualBookingsCount: manualBookings.length,
    otaBlocksCount: otaBlocks.length,
    manualBlocksCount: manualBlocks.length
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
