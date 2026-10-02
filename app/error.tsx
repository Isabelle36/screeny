'use client';

import { useEffect } from 'react';
import { outlineButton } from '@/components/ui/button-styles';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <img src="/figma/logo.svg" alt="Screeny" width={113} height={30} className="-rotate-3" />
      <div className="space-y-1.5">
        <h1 className="text-title font-medium text-foreground">The gallery didn’t load</h1>
        <p className="max-w-[40ch] text-body text-muted">
          Something went wrong fetching the screenshots — usually a hiccup in the connection. Give it another go.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-ink px-5 py-2.5 text-body font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={`${outlineButton({ size: 'custom' })} px-5 py-2.5 text-body`}
        >
          Reload page
        </button>
      </div>
    </main>
  );
}
