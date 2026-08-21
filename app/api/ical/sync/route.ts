import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const units = await prisma.unit.findMany({
      where: { icalUrls: { isEmpty: false } }
    });

    let syncStats = {
      processed: 0,
      added: 0,
      errors: 0
    };

    for (const unit of units) {
      if (!unit.icalUrls || unit.icalUrls.length === 0) continue;

      for (const url of unit.icalUrls) {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) {
            syncStats.errors++;
            continue;
          }

          const icalData = await response.text();
          
          // Simple regex parser for iCal events
          const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
          let match;

          while ((match = eventRegex.exec(icalData)) !== null) {
            const eventBlock = match[1];
            
            // Extract UID
            const uidMatch = eventBlock.match(/UID:(.+)/);
            if (!uidMatch) continue;
            const uid = uidMatch[1].trim();

            // Extract START and END
            const startMatch = eventBlock.match(/DTSTART(?:;VALUE=DATE)?:(.+)/);
            const endMatch = eventBlock.match(/DTEND(?:;VALUE=DATE)?:(.+)/);
            
            if (!startMatch || !endMatch) continue;

            const parseDateString = (dateStr: string) => {
              const cleanStr = dateStr.trim();
              if (cleanStr.length === 8) {
                // YYYYMMDD
                return new Date(`${cleanStr.slice(0,4)}-${cleanStr.slice(4,6)}-${cleanStr.slice(6,8)}T12:00:00Z`);
              }
              // Try standard parse
              return new Date(cleanStr);
            };

            const startDate = parseDateString(startMatch[1]);
            const endDate = parseDateString(endMatch[1]);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) continue;

            // Check if this block already exists (by OTA UID or just by date overlap)
            // For simplicity, we'll store the UID in `reason` or `otaSource` and use `isOtaBlock`.
            // Wait, we need to make sure we don't duplicate. We can check by `otaSource` = UID.
            
            const existingBlock = await prisma.blockedDate.findFirst({
              where: {
                apartmentId: unit.id,
                isOtaBlock: true,
                otaSource: uid
              }
            });

            if (!existingBlock) {
              await prisma.blockedDate.create({
                data: {
                  apartmentId: unit.id,
                  startDate,
                  endDate,
                  isOtaBlock: true,
                  otaSource: uid,
                  reason: 'OTA Booking'
                }
              });
              syncStats.added++;
            }
            syncStats.processed++;
          }
        } catch (e) {
          console.error(`Failed to sync URL ${url} for unit ${unit.id}:`, e);
          syncStats.errors++;
        }
      }
    }

    return NextResponse.json({ success: true, stats: syncStats });

  } catch (error) {
    console.error('Error in iCal sync:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
