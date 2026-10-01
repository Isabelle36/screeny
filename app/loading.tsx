import { PageSkeleton } from '@/components/layout/page-skeleton';

// Streams instantly while the gallery query runs (slow networks, a cold Neon database waking up).
export default function Loading() {
  return <PageSkeleton />;
}
