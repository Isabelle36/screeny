'use client';

import { useEffect, useRef } from 'react';
import { BackIcon } from '@/components/app/action-icons';
import { playPatchSound } from '@/lib/sound';

export function BackButton({ onBack }: { onBack: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => buttonRef.current?.focus({ preventScroll: true }), []);

  return (
    <div className="flex min-h-[58px] items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          playPatchSound('page-exit');
          onBack();
        }}
        className="-ml-2 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full pl-2 pr-3.5 text-body font-medium text-muted transition-colors duration-[120ms] hover:text-foreground"
      >
        <BackIcon size={20} />
        Back
      </button>
    </div>
  );
}
