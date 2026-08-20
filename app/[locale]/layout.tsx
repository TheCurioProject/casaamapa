import type { Metadata } from "next";
import { Italiana, Montserrat_Alternates } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";

import { Header } from '@/components/chrome/header';
import { Cursor } from '@/components/chrome/cursor';

import { Progress } from '@/components/chrome/progress';
import { Footer } from '@/components/chrome/footer';
import { LenisProvider } from '@/components/providers/lenis-provider';
import { BookingModal } from '@/components/ui/booking-modal';
import { Preloader } from '@/components/ui/preloader';

const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const italiana = Italiana({
  variable: "--font-italiana",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Casa Amapa — Departamentos boutique en Playa Chacala, Nayarit",
  description: "Casa Amapa: dos departamentos boutique — Tierra y Aire — a tres cuadras del mar en Playa Chacala, Nayarit.",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${montserratAlternates.variable} ${italiana.variable} antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <LenisProvider>
            <Preloader />
            <Cursor />
            <Header />
            <Progress />
            {children}
            <Footer />

            <BookingModal />
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
