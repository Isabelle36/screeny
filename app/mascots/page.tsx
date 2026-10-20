import type { Metadata } from 'next';
import { GalleryView } from '@/components/gallery/gallery-view';
import { getGalleryData } from '@/lib/db/gallery';
import { SITE_URL, SOCIAL_IMAGE } from '@/lib/site';

const title = 'Apps with Mascots — App Character Inspiration | Screeny';
const description =
  'Browse a hand-picked gallery of iOS apps with mascots. Discover character icons and App Store screenshots for illustration, branding, and product design inspiration.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/mascots` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/mascots`,
    siteName: 'Screeny',
    title,
    description,
    images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: 'Screeny — curated App Store screenshot and mascot inspiration' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [SOCIAL_IMAGE], creator: '@watermelonCodes' },
};

export default async function MascotsPage() {
  const data = await getGalleryData({ mascotsOnly: true });
  return <GalleryView {...data} initialTab="mascots" mascotsOnly />;
}
