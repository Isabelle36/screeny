import { GalleryView } from '@/components/gallery/gallery-view';
import { getGalleryData } from '@/lib/db/gallery';

export const revalidate = 600;

export default async function Page() {
  const { apps, categories } = await getGalleryData();
  return <GalleryView apps={apps} categories={categories} />;
}
