import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL no proporcionada' });
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      return NextResponse.json({ success: false, error: 'La URL proporcionada no tiene un formato válido.' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'text/calendar, text/plain, */*'
      }
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Error de conexión: El servidor respondió con código ${res.status}` });
    }

    const text = await res.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({ success: false, error: 'La URL responde, pero no contiene un formato iCal válido (falta BEGIN:VCALENDAR).' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ success: false, error: 'La conexión expiró por tiempo de espera. Verifica que el servidor de origen esté respondiendo.' });
    }
    return NextResponse.json({ success: false, error: `Error al verificar la conexión: ${error.message}` });
  }
}
