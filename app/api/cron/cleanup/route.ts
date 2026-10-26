import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { reconcilePayments } from '@/lib/reconciliation';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await reconcilePayments();
    if (result.confirmed > 0 || result.expired > 0) {
      revalidatePath('/');
      revalidatePath('/admin/calendar');
      revalidatePath('/admin/bookings');
    }
    return NextResponse.json({ message: 'Payment reconciliation completed', result });
  } catch (error) {
    console.error('Error in cleanup cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
