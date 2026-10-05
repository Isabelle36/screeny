'use client';

import { SubmitAppDrawer } from '@/components/submit/submit-app-drawer';
import { CoffeeCupIcon, SpeakerOffIcon, SpeakerOnIcon } from '@/components/ui/outline-icons';
import { INFO_HREF, useInfoView } from '@/hooks/use-info-view';
import { useSoundEnabled } from '@/hooks/use-sound-enabled';
import { playSound } from '@/lib/sound';

const footerIconTone = 'grid size-6 place-items-center rounded-sm opacity-60 transition-opacity duration-[120ms] hover:opacity-100';
export const touchIconTone = 'grid size-10 place-items-center rounded-full opacity-60 transition-opacity duration-[120ms] hover:opacity-100';

const linkTone = 'text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:text-foreground';

type SecondaryLinksProps = { className?: string; itemClassName?: string; onNavigate?: () => void; activeDot?: React.ReactNode };

export function SecondaryLinks({
  className = 'space-y-[7px]',
  itemClassName = 'inline-flex items-center gap-2 rounded-sm',
  onNavigate,
  activeDot,
}: SecondaryLinksProps) {
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
          {info.isOpen && activeDot}
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
      <li>
        <a
          href="https://github.com/Isabelle36/screeny"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Star Screeny on GitHub (opens in a new tab)"
          title="Star Screeny on GitHub"
          className={`${tone} text-icon`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="block">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
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
        if (!isSoundOn) playSound('toggle-on');
      }}
      className={className}
    >
      {isSoundOn ? <SpeakerOnIcon size={19} className="block" /> : <SpeakerOffIcon size={19} className="block" />}
    </button>
  );
}
