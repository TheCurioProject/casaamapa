import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = await props.params;
  try {
    const blockId = params.id;
    if (!blockId) {
      return NextResponse.json({ error: 'Falta blockId' }, { status: 400 });
    }

    await prisma.blockedDate.delete({
      where: { id: blockId }
    });

    revalidatePath('/admin/bookings');
    revalidatePath('/admin/calendar');
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: 'Error al eliminar bloqueo' }, { status: 500 });
  }
}
