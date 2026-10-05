'use client';

import { useRef, useState } from 'react';
import { AccountMenuItems } from '@/components/auth/account-button';
import { useInfoView } from '@/hooks/use-info-view';
import { SIDEBAR_TABS, type BrowseTab } from '@/lib/browse';
import { playSound } from '@/lib/sound';
import { Copyright, SecondaryLinks, SocialLinks, SoundToggle, touchIconTone } from './footer';

type MobileMenuProps = {
  activeTab: BrowseTab;
  onSelectTab: (tab: BrowseTab) => void;
};

const GROUP_HEADING = 'mb-2 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted';
const ITEM =
  'flex h-11 w-full items-center gap-2.5 text-left text-[1.375rem] font-medium tracking-[-0.03em] transition-colors duration-[120ms] ease-[ease]';

export function MobileMenu({ activeTab, onSelectTab }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const infoView = useInfoView();

  const setOpen = (next: boolean, { restoreFocus = false } = {}) => {
    setIsOpen(next);
    playSound(next ? 'drawer-open' : 'drawer-close');
    if (restoreFocus) buttonRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || event.defaultPrevented) return;
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    if (event.key === 'Escape') {
      setOpen(false, { restoreFocus: true });
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [buttonRef.current, ...(panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
  };

  return (
    <div onKeyDown={handleKeyDown} className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="site-menu"
        aria-label="Menu"
        className="grid size-10 place-items-center rounded-full text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors duration-[120ms] hover:bg-surface"
      >
        <span aria-hidden="true" className="relative block h-[11px] w-4">
          <span
            className={`absolute inset-x-0 top-0 h-[1.5px] rounded-full bg-current transition-[translate,rotate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isOpen ? 'translate-y-[4.75px] rotate-45' : ''
            }`}
          />
          <span
            className={`absolute inset-x-0 bottom-0 h-[1.5px] rounded-full bg-current transition-[translate,rotate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isOpen ? '-translate-y-[4.75px] -rotate-45' : ''
            }`}
          />
        </span>
      </button>

      <div
        ref={panelRef}
        id="site-menu"
        data-open={isOpen}
        inert={!isOpen}
        className="site-menu fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-y-auto bg-background px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 md:top-[75px] md:px-8"
      >
        <nav aria-labelledby="menu-browse-heading">
          <h2 id="menu-browse-heading" className={GROUP_HEADING}>
            Browse
          </h2>
          <ul>
            {SIDEBAR_TABS.map((tab) => {
              const isActive = tab.id === activeTab && !infoView.isOpen;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setOpen(false, { restoreFocus: true });
                    }}
                    className={`${ITEM} ${isActive ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
                  >
                    {tab.label}
                    {isActive && <img src="/figma/dot.svg" alt="" width={6} height={6} className="block" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-8">
          <h2 className={GROUP_HEADING}>More</h2>
          <SecondaryLinks
            className=""
            itemClassName={ITEM}
            onNavigate={() => setOpen(false)}
            activeDot={<img key="dot" src="/figma/dot.svg" alt="" width={6} height={6} className="block" />}
          />
        </div>

        <div className="mt-8">
          <h2 className={GROUP_HEADING}>Account</h2>
          <AccountMenuItems itemClassName={ITEM} onNavigate={() => setOpen(false)} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-body-sm text-muted">
          <Copyright />
          <ul className="-mr-2 flex items-center" aria-label="Sound and social links">
            <li>
              <SoundToggle className={`${touchIconTone} text-icon`} />
            </li>
            <SocialLinks tone={touchIconTone} />
          </ul>
        </div>
      </div>
    </div>
  );
}
