import { NextResponse } from 'next/server';
import { syncIcalCalendars } from '@/lib/ical-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await syncIcalCalendars();
    return NextResponse.json({ success: stats.errors === 0, stats }, { status: stats.errors ? 207 : 200 });
  } catch (error) {
    console.error('Fatal iCal cron error:', error);
    return NextResponse.json({ error: 'iCal synchronization failed' }, { status: 500 });
  }
}
