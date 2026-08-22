import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getInvoiceHtml } from '@/lib/invoice-template';

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { unit: true }
    });

    if (!booking) {
      return new NextResponse('Reserva no encontrada', { status: 404 });
    }

    // Replace the access box with a print button script for the web view
    let htmlContent = getInvoiceHtml(booking);
    
    // Add print script
    htmlContent = htmlContent.replace('</body>', `
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
      <style>
        @media print {
          body { background-color: #ffffff !important; }
          .container { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
        }
      </style>
    </body>`);

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
