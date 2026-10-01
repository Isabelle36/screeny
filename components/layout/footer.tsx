'use client';

import { useSoundEnabled } from '@/hooks/use-sound-enabled';
import { playSound } from '@/lib/sound';

// TODO before submission: point these at the real submit page, info page and social profiles.
const SECONDARY_LINKS = [
  { label: 'Submit an app', href: '#submit' },
  { label: 'Info', href: '#info' },
];

const SOCIAL_LINKS = [
  { label: 'Screeny on X', href: '#', icon: '/figma/x.svg' },
  { label: 'Buy me a coffee', href: '#', icon: '/figma/buy-me-a-coffee.svg' },
];

const linkTone = 'text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:text-foreground';

export function SecondaryLinks() {
  return (
    <ul className="space-y-[7px] text-body">
      {SECONDARY_LINKS.map((link) => (
        <li key={link.label}>
          <a href={link.href} className={`rounded-sm ${linkTone}`}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

// Pinned to the bottom of the sidebar.
export function Footer() {
  return (
    <footer className="text-body-sm text-muted">
      <img src="/figma/divider.svg" alt="" width={219} height={1} />
      <div className="mt-[7px] flex items-center justify-between">
        <p className="flex items-center gap-[3px]">
          <img src="/figma/copyright.svg" alt="" width={10} height={10} className="icon-ink opacity-60" />
          <span className="sr-only">Copyright</span> 2026
        </p>
        <ul className="flex items-center gap-1" aria-label="Social links and settings">
          <li>
            <SoundToggle />
          </li>
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} aria-label={link.label} className="block rounded-sm p-1 opacity-60 transition-opacity duration-[120ms] hover:opacity-100">
                <img src={link.icon} alt="" width={16} height={16} className="icon-ink" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

// For anyone who finds interface sounds distracting or uncomfortable. Remembered per browser.
export function SoundToggle() {
  const [isSoundOn, setSoundOn] = useSoundEnabled();
  return (
    <button
      type="button"
      aria-pressed={isSoundOn}
      aria-label="Interface sounds"
      title={isSoundOn ? 'Sounds on' : 'Sounds off'}
      onClick={() => {
        setSoundOn(!isSoundOn);
        // Confirm "on" audibly; turning sound off stays silent.
        if (!isSoundOn) playSound('toggle', { direction: 'forward' });
      }}
      className="block rounded-sm p-1 text-foreground opacity-60 transition-opacity duration-[120ms] hover:opacity-100"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 6v4h2.5l3.5 3V3L5 6z" />
        {isSoundOn ? (
          <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.75a6 6 0 0 1 0 8.5" />
        ) : (
          <path d="m11 6 3.5 4m0-4L11 10" />
        )}
      </svg>
    </button>
  );
}
