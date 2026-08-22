import { NextResponse } from 'next/server';
import { cleanupExpiredPendingBookings } from '@/app/actions/bookings';

export async function GET(request: Request) {
  try {
    const result = await cleanupExpiredPendingBookings();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ message: 'Cleanup successful', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error in cleanup cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
