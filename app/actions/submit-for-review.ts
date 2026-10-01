'use server';

import { prisma } from '@/lib/db/client';

export type SubmitState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'submitted'; appName: string | null; alreadyListed: boolean };

const APP_STORE_LINK = /^https?:\/\/(?:apps|itunes)\.apple\.com\/(?:[a-z]{2}\/)?(?:app\/)?(?:[^/?#]+\/)?id(\d{6,12})(?:[/?#].*)?$/i;

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

    const existing = await prisma.submission.findUnique({ where: { trackId }, select: { id: true } });
    if (!existing) {
      await prisma.submission.create({ data: { trackId, appStoreUrl: link.slice(0, 500), appName } });
      await emailSubmission({ link, appName, trackId });
    }
    return { status: 'submitted', appName, alreadyListed: false };
  } catch (error) {
    console.error('App submission failed:', error);
    return { status: 'error', message: 'Something went wrong on our side. Please try again in a moment.' };
  }
}

const SUBMISSIONS_INBOX = 'alficodess@gmail.com';

async function emailSubmission({ link, appName, trackId }: { link: string; appName: string | null; trackId: bigint }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`New app submission (not emailed — RESEND_API_KEY is not set): ${link}`);
    return;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.SUBMISSIONS_FROM_EMAIL ?? 'Screeny <onboarding@resend.dev>',
        to: [SUBMISSIONS_INBOX],
        subject: `New app submission: ${appName ?? `App Store id ${trackId}`}`,
        text: [`App name: ${appName ?? '(not given)'}`, `App Store link: ${link}`, `App Store id: ${trackId}`, '', 'Review it, then ingest it with scripts/ingest.ts.'].join('\n'),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) console.error(`Submission email failed (${response.status}): ${await response.text()}`);
  } catch (error) {
    console.error('Submission email failed:', error);
  }
}
