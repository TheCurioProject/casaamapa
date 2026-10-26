import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchIcal, parseIcalBlocks } from '@/lib/ical-sync';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL no proporcionada' });
    }

    const text = await fetchIcal(url);
    const events = parseIcalBlocks(text, 'verification', url);
    return NextResponse.json({ success: true, events: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: `Error al verificar la conexión: ${message}` });
  }
}
