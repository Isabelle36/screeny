import { GalleryView } from '@/components/gallery/gallery-view';
import { getGalleryData } from '@/lib/db/gallery';

// Re-fetch the library at most every 10 minutes so newly ingested apps show up without a redeploy.
export const revalidate = 600;

export default async function Page() {
  const { apps, categories } = await getGalleryData();
  return <GalleryView apps={apps} categories={categories} />;
}
