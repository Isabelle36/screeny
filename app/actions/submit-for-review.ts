'use server';

import { prisma } from '@/lib/db/client';

export type SubmitState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'submitted'; appName: string | null; alreadyListed: boolean };

// https://apps.apple.com/us/app/flighty/id1358823008 — the country and the name segment are optional.
const APP_STORE_LINK = /^https?:\/\/(?:apps|itunes)\.apple\.com\/(?:[a-z]{2}\/)?(?:app\/)?(?:[^/?#]+\/)?id(\d{6,12})(?:[/?#].*)?$/i;

// Saves a suggested app for review. Nothing is added to the gallery here — that happens after review,
// so a public form can never write to the library directly.
export async function submitAppForReview(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const link = String(formData.get('appStoreUrl') ?? '').trim();
  const appName = String(formData.get('appName') ?? '').trim().slice(0, 120) || null;

  const match = link.match(APP_STORE_LINK);
  if (!match) {
    return { status: 'error', message: 'Paste the app’s App Store link, like https://apps.apple.com/app/id1234567890.' };
  }

  const trackId = BigInt(match[1]);
  try {
    const listed = await prisma.app.findUnique({ where: { trackId }, select: { name: true } });
    if (listed) return { status: 'submitted', appName: listed.name, alreadyListed: true };

    // Re-submitting the same app keeps the first submission.
    await prisma.submission.upsert({
      where: { trackId },
      create: { trackId, appStoreUrl: link.slice(0, 500), appName },
      update: {},
    });
    return { status: 'submitted', appName, alreadyListed: false };
  } catch (error) {
    console.error('App submission failed:', error);
    return { status: 'error', message: 'Something went wrong on our side. Please try again in a moment.' };
  }
}
