import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = await props.params;
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: 'Falta bookingId' }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    revalidatePath('/admin/bookings');
    revalidatePath('/admin/calendar');
    revalidatePath('/');
    
    return NextResponse.json({
      success: true,
      paymentRequiresReview: booking.amountPaidCents > 0 || Boolean(booking.stripePaymentIntentId),
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Error al eliminar reserva' }, { status: 500 });
  }
}
