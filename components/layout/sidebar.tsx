'use client';

import { animate, motion, type Transition } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { SpatialTooltip, useSpatialTooltip } from '@/components/ui/spatial-tooltip';
import { useInfoView } from '@/hooks/use-info-view';
import { captureFlip, playFlip } from '@/lib/animations/flip';
import { dotSpring, quickFade } from '@/lib/animations/transitions';
import { playSound } from '@/lib/sound';
import { SIDEBAR_TABS, type BrowseTab } from '@/lib/browse';
import { Footer, SecondaryLinks, SoundToggle } from './footer';

const OPEN_WIDTH = 267;
const COLLAPSED_WIDTH = 88;
const crossfade: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };

type SidebarProps = {
  activeTab: BrowseTab;
  onSelectTab: (tab: BrowseTab) => void;
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isInstant, setIsInstant] = useState(false);
  const { containerRef, tooltipRef, apiRef, triggerProps, hide: hideTooltip } = useSpatialTooltip();
  const infoView = useInfoView();
  const currentTab = infoView.isOpen ? null : activeTab;

  const toggle = (event: React.MouseEvent) => {
    const instant = event.detail === 0 || prefersReducedMotion();
    playSound(isOpen ? 'toggle-off' : 'toggle-on');
    const snapshots = instant ? [] : captureFlip();
    flushSync(() => {
      setIsInstant(instant);
      setIsOpen(!isOpen);
    });
    playFlip(snapshots);
  };

  const visibleWidth = isOpen ? OPEN_WIDTH : COLLAPSED_WIDTH;

  return (
    <aside
      ref={containerRef}
      className="sticky top-[75px] z-10 hidden h-[calc(100dvh-75px)] shrink-0 self-start lg:block"
      style={{ width: visibleWidth }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: OPEN_WIDTH,
          clipPath: `inset(0 ${OPEN_WIDTH - visibleWidth}px 0 0)`,
          transition: isInstant ? 'none' : 'clip-path 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={crossfade}
          inert={!isOpen}
          className="absolute inset-y-0 left-0 flex flex-col pb-6 pl-8 pr-4"
          style={{ width: OPEN_WIDTH }}
        >
          <ToggleRow isOpen onToggle={toggle} />
          <LabelNav activeTab={currentTab} onSelectTab={onSelectTab} />
          <div className="mt-[clamp(40px,12vh,134px)]">
            <SecondaryLinks activeDot={<DotSlot id="info" />} />
          </div>
          <SlidingDot activeId={infoView.isOpen ? 'info' : activeTab} />
          <div className="mt-auto pt-8">
            <Footer />
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={crossfade}
          inert={isOpen}
          className="absolute inset-y-0 left-0 flex flex-col items-center pb-6"
          style={{ width: COLLAPSED_WIDTH }}
        >
          <ToggleRow isOpen={false} onToggle={toggle} />
          <IconRail activeTab={currentTab} onSelectTab={onSelectTab} triggerProps={triggerProps} onLeave={hideTooltip} />
          <div className="mt-auto">
            <SoundToggle />
            {/* sound toggle */}
          </div>
        </motion.div>
      </div>
      <SpatialTooltip labels={SIDEBAR_TABS.map((tab) => tab.label)} tooltipRef={tooltipRef} apiRef={apiRef} />
    </aside>
  );
}

function ToggleRow({ isOpen, onToggle }: { isOpen: boolean; onToggle: (event: React.MouseEvent) => void }) {
  return (
    <div className={`flex h-[58px] shrink-0 items-center ${isOpen ? 'justify-end' : 'justify-center'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="browse-nav"
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="rounded-md p-1.5 opacity-80 transition-opacity duration-[120ms] hover:opacity-100"
      >
        <img src={isOpen ? '/figma/sidebar-toggle.svg' : '/figma/sidebar-toggle-closed.svg'} alt="" width={20} height={20} />
      </button>
    </div>
  );
}

type NavProps = { activeTab: BrowseTab | null; onSelectTab: (tab: BrowseTab) => void };

function LabelNav({ activeTab, onSelectTab }: NavProps) {
  return (
    <nav id="browse-nav" aria-labelledby="browse-heading" className="mt-12">
      <h2 id="browse-heading" className="mb-3.5 text-body font-medium text-muted">
        Browse
      </h2>
      <ul className="space-y-[7px]">
        {SIDEBAR_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <li key={tab.id}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-md text-left text-body transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] ${
                  isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
                {isActive && <DotSlot id={tab.id} />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type RailProps = NavProps & {
  triggerProps: ReturnType<typeof useSpatialTooltip>['triggerProps'];
  onLeave: () => void;
};

function IconRail({ activeTab, onSelectTab, triggerProps, onLeave }: RailProps) {
  const [hoveredTab, setHoveredTab] = useState<BrowseTab | null>(null);
  const dotTab = hoveredTab ?? activeTab;

  return (
    <nav aria-label="Browse" className="mt-[60px]">
      <div
        className="relative"
        onPointerLeave={() => {
          setHoveredTab(null);
          onLeave();
        }}
      >
        <ul className="flex flex-col items-center gap-[11px]">
          {SIDEBAR_TABS.map((tab, index) => {
            const isActive = tab.id === activeTab;
            const tooltipTrigger = triggerProps(index);
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  aria-label={tab.label}
                  {...tooltipTrigger}
                  onPointerEnter={(event) => {
                    tooltipTrigger.onPointerEnter(event);
                    if (event.pointerType === 'mouse') setHoveredTab(tab.id);
                  }}
                  onClick={() => {
                    onLeave();
                    onSelectTab(tab.id);
                  }}
                  className="group/rail relative flex h-9 w-12 items-center justify-center rounded-lg"
                >
                  {tab.id === dotTab && <DotSlot id={tab.id} className="absolute -left-1.5 top-1/2 -translate-y-1/2" />}
                  <img
                    src={tab.icon.src}
                    alt=""
                    width={tab.icon.width}
                    height={tab.icon.height}
                    className={`transition-opacity duration-[120ms] ${tab.icon.ink ? 'icon-ink' : ''} ${isActive ? 'opacity-100' : 'opacity-60 group-hover/rail:opacity-100'}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <SlidingDot activeId={dotTab} />
      </div>
    </nav>
  );
}

function DotSlot({ id, className = 'block' }: { id: string; className?: string }) {
  return <span data-dot-slot={id} className={`size-[5px] ${className}`} />;
}

type DotPlacement = 'unplaced' | 'hidden' | 'shown';

function SlidingDot({ activeId }: { activeId: string | null }) {
  const dotRef = useRef<HTMLImageElement>(null);
  const placement = useRef<DotPlacement>('unplaced');

  useLayoutEffect(() => {
    const dot = dotRef.current;
    const container = dot?.offsetParent;
    if (!dot || !(container instanceof HTMLElement)) return;

    const instant = { duration: 0 };
    const canAnimate = !prefersReducedMotion();
    const slot = activeId ? container.querySelector<HTMLElement>(`[data-dot-slot="${activeId}"]`) : null;

    if (!slot) {
      if (placement.current === 'shown') animate(dot, { opacity: 0, scale: 0.4 }, canAnimate ? quickFade : instant);
      if (placement.current !== 'unplaced') placement.current = 'hidden';
      return;
    }

    const slotOffset = () => {
      const containerBox = container.getBoundingClientRect();
      const slotBox = slot.getBoundingClientRect();
      return { x: slotBox.left - containerBox.left, y: slotBox.top - containerBox.top };
    };

    animate(dot, slotOffset(), placement.current === 'shown' && canAnimate ? dotSpring : instant);
    if (placement.current !== 'shown') {
      animate(dot, { opacity: 1, scale: 1 }, placement.current === 'hidden' && canAnimate ? quickFade : instant);
    }
    placement.current = 'shown';

    let isInitialObservation = true;
    const observer = new ResizeObserver(() => {
      if (isInitialObservation) {
        isInitialObservation = false;
        return;
      }
      animate(dot, slotOffset(), instant);
    });
    observer.observe(container);
    observer.observe(slot.parentElement ?? slot);
    return () => observer.disconnect();
  }, [activeId]);

  return (
    <img
      ref={dotRef}
      src="/figma/dot.svg"
      alt=""
      width={5}
      height={5}
      className="pointer-events-none absolute left-0 top-0 block opacity-0"
    />
  );
}
