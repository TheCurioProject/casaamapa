import type { Metadata, Viewport } from "next";
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
import { GlobalLoader } from '@/components/ui/global-loader';
import { BookingSuccessModal } from '@/components/ui/booking-success-modal';
import { Suspense } from 'react';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#D98BA0',
};

export const metadata: Metadata = {
  title: "Casa Amapa — Departamentos boutique en Playa Chacala, Nayarit",
  description: "Tres departamentos boutique — Tierra, Agua y Aire — a tres cuadras del mar en Playa Chacala, Nayarit. Piscina infinity, cocinas completas, estacionamiento privado. Reserva directo.",
  metadataBase: new URL("https://casaamapa.com"),
  alternates: {
    canonical: "/",
    languages: { "es": "/es", "en": "/en" },
  },
  openGraph: {
    title: "Casa Amapa — Departamentos boutique en Playa Chacala",
    description: "Un refugio entre la selva y el mar. Tres departamentos boutique con piscina infinity en la Riviera Nayarit.",
    url: "https://casaamapa.com",
    siteName: "Casa Amapa",
    images: [
      {
        url: "/images/hero.webp",
        width: 1600,
        height: 1000,
        alt: "Fachada rosa de Casa Amapa con escalera caracol en Playa Chacala",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Amapa — Playa Chacala, Nayarit",
    description: "Tres departamentos boutique a pasos del mar. Piscina infinity, cocinas completas. Reserva directo.",
    images: ["/images/hero.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "MX-NAY",
    "geo.placename": "Chacala, Compostela, Nayarit",
    "geo.position": "21.16651;-105.22397",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Casa Amapa",
  description: "Tres departamentos boutique — Tierra, Agua y Aire — en Playa Chacala, Nayarit. Piscina infinity, cocinas completas, estacionamiento privado.",
  url: "https://casaamapa.com",
  image: "https://casaamapa.com/images/hero.webp",
  telephone: "+523113944729",
  email: "admin.casaamapa@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Playa Chacala",
    addressLocality: "Chacala",
    addressRegion: "Nayarit",
    addressCountry: "MX",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 21.16651,
    longitude: -105.22397,
  },
  priceRange: "$$$",
  starRating: { "@type": "Rating", ratingValue: "4.8" },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Piscina infinity", value: true },
    { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
    { "@type": "LocationFeatureSpecification", name: "Cocina completa", value: true },
    { "@type": "LocationFeatureSpecification", name: "Aire acondicionado", value: true },
    { "@type": "LocationFeatureSpecification", name: "Estacionamiento", value: true },
  ],
  numberOfRooms: 3,
  checkinTime: "15:00",
  checkoutTime: "11:00",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <LenisProvider>
            <Preloader />
            <GlobalLoader />
            <Cursor />
            <Header />
            <Progress />
            {children}
            <Footer />

            <BookingModal />
            <Suspense fallback={null}>
              <BookingSuccessModal />
            </Suspense>
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
