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
    take: 10
  });

  const units = await prisma.unit.findMany();

  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((acc: any, curr: any) => acc + (curr.unit?.price || 0), 0),
    units: units.length
  };

  return (
    <AdminDashboardClient stats={stats} recentBookings={bookings} />
  );
}
