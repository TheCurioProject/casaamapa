import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { syncIcalCalendars } from '@/lib/ical-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stats = await syncIcalCalendars();
    return NextResponse.json({ success: stats.errors === 0, stats }, { status: stats.errors ? 207 : 200 });
  } catch (error) {
    console.error('Manual iCal sync failed:', error);
    return NextResponse.json({ error: 'No se pudo sincronizar iCal.' }, { status: 500 });
  }
}
