'use client';

import { motion, type Transition } from 'motion/react';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { SpatialTooltip, useSpatialTooltip } from '@/components/ui/spatial-tooltip';
import { captureFlip, playFlip } from '@/lib/animations/flip';
import { snappySpring } from '@/lib/animations/transitions';
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

// Sticky under the nav, full viewport height so the footer sits at the very bottom.
//
// Collapsing never animates layout. The width changes in one step; then
//  - the sidebar's own content is revealed/hidden by a clip-path transition (paint only, no reflow), and
//  - the cards beside it FLIP from their old to their new boxes with transforms (lib/animations/flip.ts),
// so the grid stays three across and the cards scale smoothly instead of reflowing on every frame.
export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  // Open state lives here, not in GalleryView: toggling must not re-render the ~200 cards.
  const [isOpen, setIsOpen] = useState(true);
  // Keyboard-triggered toggles snap instantly — animating keyboard actions only makes them feel slow.
  const [isInstant, setIsInstant] = useState(false);
  const { containerRef, tooltipRef, apiRef, triggerProps, hide: hideTooltip } = useSpatialTooltip();

  const toggle = (event: React.MouseEvent) => {
    const instant = event.detail === 0 || prefersReducedMotion();
    playSound('toggle', { direction: isOpen ? 'back' : 'forward' });
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
      className="sticky top-[75px] z-10 hidden h-[calc(100dvh-75px)] shrink-0 self-start md:block"
      style={{ width: visibleWidth }}
    >
      {/* Always open-width; the clip shows only the current sidebar width and transitions between the two. */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: OPEN_WIDTH,
          clipPath: `inset(0 ${OPEN_WIDTH - visibleWidth}px 0 0)`,
          // Same 300ms and a matching critically-damped curve as the cards' FLIP spring, so they move as one.
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
          <LabelNav activeTab={activeTab} onSelectTab={onSelectTab} />
          <div className="mt-[clamp(40px,12vh,134px)]">
            <SecondaryLinks />
          </div>
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
          <IconRail activeTab={activeTab} onSelectTab={onSelectTab} triggerProps={triggerProps} onLeave={hideTooltip} />
          <div className="mt-auto">
            <SoundToggle />
          </div>
        </motion.div>
      </div>
      {/* Outside the clipping wrapper so it can extend over the content beside the rail. */}
      <SpatialTooltip labels={SIDEBAR_TABS.map((tab) => tab.label)} tooltipRef={tooltipRef} apiRef={apiRef} />
    </aside>
  );
}

function ToggleRow({ isOpen, onToggle }: { isOpen: boolean; onToggle: (event: React.MouseEvent) => void }) {
  return (
    // Same height as the chip row so the toggle lines up with it.
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

type NavProps = { activeTab: BrowseTab; onSelectTab: (tab: BrowseTab) => void };

// After recent.design: quiet grey labels, the active one goes full black with a dot beside it.
// Hover is a fast color change only — these get clicked constantly, so nothing moves on hover.
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
                {/* layoutId: Motion carries the dot between items, handling fast or interrupted switches. */}
                {isActive && <ActiveDot layoutId="sidebar-label-dot" />}
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

// Icons sit centered in the rail; the dot sits beside them, outside the flow, so it never shifts an icon.
// The dot follows the pointer (alongside the tooltip) and springs back to the active tab when the pointer
// leaves the rail; clicking makes the hovered tab active, so the dot stays there.
function IconRail({ activeTab, onSelectTab, triggerProps, onLeave }: RailProps) {
  // Tracked here, not in Sidebar: following the pointer re-renders only these few buttons.
  const [hoveredTab, setHoveredTab] = useState<BrowseTab | null>(null);
  const dotTab = hoveredTab ?? activeTab;

  return (
    <nav aria-label="Browse" className="mt-[60px]">
      <div
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
                  {tab.id === dotTab && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2">
                      <ActiveDot layoutId="sidebar-rail-dot" />
                    </span>
                  )}
                  <img
                    src={tab.icon.src}
                    alt=""
                    width={tab.icon.width}
                    height={tab.icon.height}
                    // Only inactive = 60%. `ink` darkens the grey Figma glyphs; the screenshots glyph is already dark and has
                    // white details that the filter would fill in (making it look active), so it's left as drawn.
                    className={`transition-opacity duration-[120ms] ${tab.icon.ink ? 'icon-ink' : ''} ${isActive ? 'opacity-100' : 'opacity-60 group-hover/rail:opacity-100'}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function ActiveDot({ layoutId }: { layoutId: string }) {
  return (
    <motion.img
      layoutId={layoutId}
      transition={snappySpring}
      src="/figma/dot.svg"
      alt=""
      width={5}
      height={5}
      className="block"
    />
  );
}
