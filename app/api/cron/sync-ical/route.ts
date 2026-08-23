import { NextResponse } from 'next/server';
import { prisma, ExtTxClient } from '@/lib/db';
import ical from 'node-ical';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured on server' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all units with iCal URLs
    const units = await prisma.unit.findMany({
      where: {
        icalUrls: {
          isEmpty: false
        }
      }
    });

    let totalSynced = 0;
    const errors: string[] = [];

    // 3. Process each unit
    for (const unit of units) {
      if (!unit.icalUrls || unit.icalUrls.length === 0) continue;

      for (const url of unit.icalUrls) {
        try {
          // Fetch and parse iCal from OTA
          const events = await ical.async.fromURL(url);

          // Find valid events with start and end dates
          const newBlocks: any[] = [];
          for (const key in events) {
            const event = events[key] as any;
            if (event?.type === 'VEVENT' && event?.start && event?.end) {
              // Ensure dates are valid
              const startDate = new Date(event.start);
              const endDate = new Date(event.end);
              
              if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                let reason = 'OTA Sync Block';
                if (event.summary) {
                  reason = typeof event.summary === 'string' ? event.summary : event.summary.val;
                }
                newBlocks.push({
                  apartmentId: unit.id,
                  startDate,
                  endDate,
                  reason,
                  isOtaBlock: true,
                  otaSource: url
                });
              }
            }
          }

          // Transaction: Delete old blocks for this specific OTA URL, and insert new ones
          await prisma.$transaction(async (tx: ExtTxClient) => {
            await tx.blockedDate.deleteMany({
              where: {
                apartmentId: unit.id,
                isOtaBlock: true,
                otaSource: url
              }
            });

            if (newBlocks.length > 0) {
              await tx.blockedDate.createMany({
                data: newBlocks
              });
            }
          });

          totalSynced += newBlocks.length;
        } catch (err) {
          console.error(`Error syncing URL ${url} for unit ${unit.id}:`, err);
          errors.push(`Failed to sync ${url}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. Added/Updated ${totalSynced} blocks.`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Fatal error in sync-ical cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
