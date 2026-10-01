'use client';

import { SubmitAppDrawer } from '@/components/submit/submit-app-drawer';
import { CoffeeCupIcon, SpeakerOffIcon, SpeakerOnIcon } from '@/components/ui/outline-icons';
import { useSoundEnabled } from '@/hooks/use-sound-enabled';
import { playSound } from '@/lib/sound';

const SECONDARY_LINKS = [{ label: 'Info', href: '#info' }];

const footerIconTone = 'grid size-6 place-items-center rounded-sm opacity-60 transition-opacity duration-[120ms] hover:opacity-100';

const linkTone = 'text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:text-foreground';

export function SecondaryLinks() {
  return (
    <ul className="space-y-[7px] text-body">
      <li>
        <SubmitAppDrawer triggerClassName={`cursor-pointer rounded-sm ${linkTone}`} />
      </li>
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
          <li>
            <a href="#" aria-label="Screeny on X" className={footerIconTone}>
              <img src="/figma/x.svg" alt="" width={16} height={16} className="icon-ink block" />
            </a>
          </li>
          <li>
            <a href="#" aria-label="Buy me a coffee" className={`${footerIconTone} text-icon`}>
              <CoffeeCupIcon size={16} className="block" />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

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
        if (!isSoundOn) playSound('toggle', { direction: 'forward' });
      }}
      className={`${footerIconTone} text-icon`}
    >
      {isSoundOn ? <SpeakerOnIcon size={19} className="block" /> : <SpeakerOffIcon size={19} className="block" />}
    </button>
  );
}
