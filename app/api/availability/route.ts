import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apartmentId = searchParams.get('apartmentId');

  if (!apartmentId) {
    return NextResponse.json({ error: 'apartmentId is required' }, { status: 400 });
  }

  try {
    let idsToCheck = [apartmentId];
    
    if (apartmentId === 'amapa') {
      // If booking the whole house, check if ANY subunit or the house itself is booked
      idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
    } else {
      // If booking a subunit, check if the subunit itself OR the whole house is booked
      idsToCheck = [apartmentId, 'amapa'];
    }

    const bookings = await prisma.booking.findMany({
      where: {
        apartmentId: {
          in: idsToCheck
        },
        status: {
          in: ['confirmed', 'pending']
        },
        // We only care about future/current bookings realistically, but let's just pull all that haven't ended yet
        checkOut: {
          gte: new Date()
        }
      },
      select: {
        checkIn: true,
        checkOut: true,
        apartmentId: true,
      }
    });

    // We can map these to a list of { from, to } objects representing disabled date ranges
    const disabledRanges = bookings.map(b => ({
      from: b.checkIn.toISOString(),
      to: b.checkOut.toISOString(),
    }));

    return NextResponse.json({ disabledRanges });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
