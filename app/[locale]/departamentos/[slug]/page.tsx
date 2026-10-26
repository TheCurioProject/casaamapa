import { notFound } from 'next/navigation';
import { apartmentsData } from '@/lib/data/apartments';
import { AptPageContent } from '@/components/ui/apt-page-content';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  const locales = routing.locales;
  const slugs = ['tierra', 'agua', 'aire'];

  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export default async function DepartmentPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  const apt = apartmentsData[slug as keyof typeof apartmentsData];

  if (!apt || typeof apt !== 'object' || !('name' in apt)) {
    notFound();
  }

  return <AptPageContent apt={apt} />;
}
