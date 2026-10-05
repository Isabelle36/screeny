'use client';

import { useEffect, useRef, useState } from 'react';
import { SettingsModal } from '@/components/auth/settings-modal';
import { useInfoView } from '@/hooks/use-info-view';
import { SIDEBAR_TABS, type BrowseTab } from '@/lib/browse';
import { playSound } from '@/lib/sound';
import { SecondaryLinks } from './footer';

type AccountMenuProps = {
  name: string | null;
  email: string;
  imageUrl: string;
  activeTab: BrowseTab;
  onSelectTab: (tab: BrowseTab) => void;
  onSignOut: () => void;
};

const ROW =
  'flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-[7px] px-2.5 text-left text-body-sm text-black-600 transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:bg-black/4';
const SECTION = 'border-t border-white-100 p-1';

export function AccountMenu({ name, email, imageUrl, activeTab, onSelectTab, onSignOut }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const infoView = useInfoView();
  const currentTab = infoView.isOpen ? null : activeTab;

  const setOpen = (next: boolean, { restoreFocus = false } = {}) => {
    setIsOpen(next);
    playSound(next ? 'drawer-open' : 'drawer-close');
    if (restoreFocus) buttonRef.current?.focus();
  };

  const selectTab = (tab: BrowseTab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [isOpen]);

  return (
    <>
      <div
        ref={rootRef}
        className="relative"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isOpen) setOpen(false, { restoreFocus: true });
        }}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="account-menu"
          aria-label="Account and menu"
          className="grid size-10 cursor-pointer place-items-center rounded-full transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <img src={imageUrl} alt="" width={30} height={30} className="size-[30px] rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)]" />
        </button>

        <div
          id="account-menu"
          data-open={isOpen}
          inert={!isOpen}
          className="account-menu absolute right-0 top-full z-40 mt-1.5 max-h-[calc(100dvh-5rem)] w-[224px] overflow-y-auto rounded-[12px] bg-background shadow-[0_0_0_1px_var(--white-200),0_12px_32px_-12px_rgba(0,0,0,0.16)]"
        >
          <div className="px-3.5 py-2.5">
            {name && <p className="truncate text-body-sm font-semibold text-black-700">{name}</p>}
            <p className="truncate text-body-sm text-muted">{email}</p>
          </div>

          <ul className={SECTION}>
            {SIDEBAR_TABS.map((tab) => (
              <li key={tab.id} className="lg:hidden">
                <MenuTab label={tab.label} isActive={tab.id === currentTab} onSelect={() => selectTab(tab.id)} />
              </li>
            ))}
            <li>
              <MenuTab label="Saved" isActive={currentTab === 'saved'} onSelect={() => selectTab('saved')} />
            </li>
          </ul>

          <div className={`${SECTION} lg:hidden`}>
            <SecondaryLinks className="" itemClassName={ROW} tone="" onNavigate={() => setIsOpen(false)} activeDot={<ActiveDot />} />
          </div>

          <div className={SECTION}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSettingsOpen(true);
              }}
              className={ROW}
            >
              Settings
            </button>
          </div>

          <div className={SECTION}>
            <button
              type="button"
              onClick={() => {
                playSound('tap');
                setIsOpen(false);
                onSignOut();
              }}
              className={ROW}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

function MenuTab({ label, isActive, onSelect }: { label: string; isActive: boolean; onSelect: () => void }) {
  return (
    <button type="button" aria-pressed={isActive} onClick={onSelect} className={ROW}>
      {label}
      {isActive && <ActiveDot />}
    </button>
  );
}

function ActiveDot() {
  return <img src="/figma/dot.svg" alt="" width={5} height={5} className="block" />;
}
