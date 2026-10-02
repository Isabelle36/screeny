'use client';

import { SubmitAppDrawer } from '@/components/submit/submit-app-drawer';
import { CoffeeCupIcon, SpeakerOffIcon, SpeakerOnIcon } from '@/components/ui/outline-icons';
import { INFO_HREF, useInfoView } from '@/hooks/use-info-view';
import { useSoundEnabled } from '@/hooks/use-sound-enabled';
import { playSound } from '@/lib/sound';

const footerIconTone = 'grid size-6 place-items-center rounded-sm opacity-60 transition-opacity duration-[120ms] hover:opacity-100';
export const touchIconTone = 'grid size-10 place-items-center rounded-full opacity-60 transition-opacity duration-[120ms] hover:opacity-100';

const linkTone = 'text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:text-foreground';

type SecondaryLinksProps = { className?: string; itemClassName?: string; onNavigate?: () => void };

export function SecondaryLinks({ className = 'space-y-[7px]', itemClassName = 'rounded-sm', onNavigate }: SecondaryLinksProps) {
  const info = useInfoView();

  const openInfo = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    info.open();
    onNavigate?.();
  };

  return (
    <ul className={`text-body ${className}`}>
      <li>
        <SubmitAppDrawer triggerClassName={`cursor-pointer ${itemClassName} ${linkTone}`} />
      </li>
      <li>
        <a
          href={INFO_HREF}
          onClick={openInfo}
          aria-current={info.isOpen ? 'page' : undefined}
          className={`${itemClassName} ${info.isOpen ? 'text-foreground' : linkTone}`}
        >
          Info
        </a>
      </li>
    </ul>
  );
}

export function SocialLinks({ tone }: { tone: string }) {
  return (
    <>
      <li>
        <a
          href="https://x.com/watermelonCodes"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Screeny on X (opens in a new tab)"
          className={tone}
        >
          <img src="/figma/x.svg" alt="" width={16} height={16} className="icon-ink block" />
        </a>
      </li>
      <li>
        <a
          href="https://buymeacoffee.com/alficodessx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buy me a coffee (opens in a new tab)"
          className={`${tone} text-icon`}
        >
          <CoffeeCupIcon size={16} className="block" />
        </a>
      </li>
    </>
  );
}

export function Copyright() {
  return (
    <p className="flex items-center gap-[3px]">
      <img src="/figma/copyright.svg" alt="" width={10} height={10} className="icon-ink opacity-60" />
      <span className="sr-only">Copyright</span> 2026
    </p>
  );
}

export function Footer() {
  return (
    <footer className="text-body-sm text-muted">
      <img src="/figma/divider.svg" alt="" width={219} height={1} />
      <div className="mt-[7px] flex items-center justify-between">
        <Copyright />
        <ul className="flex items-center gap-1" aria-label="Social links and settings">
          <li>
            <SoundToggle />
          </li>
          <SocialLinks tone={footerIconTone} />
        </ul>
      </div>
    </footer>
  );
}

export function SoundToggle({ className = `${footerIconTone} text-icon` }: { className?: string }) {
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
      className={className}
    >
      {isSoundOn ? <SpeakerOnIcon size={19} className="block" /> : <SpeakerOffIcon size={19} className="block" />}
    </button>
  );
}
