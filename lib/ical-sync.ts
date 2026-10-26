import { isIP } from 'node:net';
import { resolve4, resolve6 } from 'node:dns/promises';
import ical from 'node-ical';
import { prisma } from '@/lib/db';
import { addDays, toDateOnly } from '@/lib/booking';

type CalendarEvent = {
  type?: string;
  uid?: string;
  start?: Date;
  end?: Date;
  summary?: string | { val?: string };
};

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')) return true;
  const parts = normalized.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168);
}

export async function assertSafeIcalUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('La URL iCal debe usar HTTPS y no incluir credenciales.');
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local')) throw new Error('Host iCal no permitido.');
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error('Dirección iCal privada no permitida.');
    return url;
  }

  const addresses = [
    ...(await resolve4(hostname).catch(() => [])),
    ...(await resolve6(hostname).catch(() => [])),
  ];
  if (!addresses.length) throw new Error('No se pudo resolver el host iCal.');
  if (addresses.some(isPrivateAddress)) throw new Error('El host iCal apunta a una red privada.');
  return url;
}

export async function fetchIcal(rawUrl: string) {
  let url = await assertSafeIcalUrl(rawUrl);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        redirect: 'manual',
        signal: controller.signal,
        headers: { Accept: 'text/calendar, text/plain;q=0.9' },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`Redirección iCal ${response.status} sin destino.`);
        url = await assertSafeIcalUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new Error(`El servidor iCal respondió ${response.status}.`);
      const text = await response.text();
      if (text.length > 2_000_000) throw new Error('El calendario iCal excede el tamaño permitido.');
      if (!text.includes('BEGIN:VCALENDAR')) throw new Error('La respuesta no contiene un calendario iCal.');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('El calendario iCal excedió el límite de redirecciones.');
}

export function parseIcalBlocks(text: string, apartmentId: string, sourceUrl: string) {
  const parsed = ical.parseICS(text) as unknown as Record<string, CalendarEvent>;
  const blocks: Array<{
    apartmentId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    isOtaBlock: boolean;
    otaSource: string;
    externalUid: string;
  }> = [];

  for (const [key, event] of Object.entries(parsed)) {
    if (event.type !== 'VEVENT' || !(event.start instanceof Date) || !(event.end instanceof Date)) continue;
    const uid = String(event.uid || key);
    if (uid.includes('@amapachacala.com') || uid.includes('@casaamapa.com')) continue;

    const startDate = new Date(`${toDateOnly(event.start)}T12:00:00Z`);
    const endExclusive = new Date(`${toDateOnly(event.end)}T12:00:00Z`);
    if (endExclusive <= startDate) continue;
    const summary = typeof event.summary === 'string' ? event.summary : event.summary?.val;
    blocks.push({
      apartmentId,
      startDate,
      endDate: addDays(endExclusive, -1),
      reason: summary?.slice(0, 500) || 'Bloqueado por OTA',
      isOtaBlock: true,
      otaSource: sourceUrl,
      externalUid: uid.slice(0, 500),
    });
  }
  return blocks;
}

export async function syncIcalCalendars() {
  const units = await prisma.unit.findMany({ where: { icalUrls: { isEmpty: false } } });
  const stats = { sources: 0, events: 0, errors: 0 };
  const errors: string[] = [];

  for (const unit of units) {
    for (const sourceUrl of unit.icalUrls) {
      stats.sources += 1;
      try {
        const blocks = parseIcalBlocks(await fetchIcal(sourceUrl), unit.id, sourceUrl);
        await prisma.$transaction(async (tx) => {
          await tx.blockedDate.deleteMany({
            where: { apartmentId: unit.id, isOtaBlock: true, otaSource: sourceUrl },
          });
          if (blocks.length) await tx.blockedDate.createMany({ data: blocks, skipDuplicates: true });
        });
        stats.events += blocks.length;
      } catch (error) {
        stats.errors += 1;
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${unit.id}: ${message}`);
      }
    }
  }

  await prisma.syncLog.create({
    data: {
      status: stats.errors ? 'WARNING' : 'SUCCESS',
      message: `Fuentes: ${stats.sources}; eventos: ${stats.events}; errores: ${stats.errors}${errors.length ? `; ${errors.join(' | ')}` : ''}`,
    },
  });
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.syncLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return { ...stats, errorMessages: errors };
}
