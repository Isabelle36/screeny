import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { appIconAltText } from '@/lib/alt-text';
import type { GalleryApp } from '@/lib/db/gallery';
import { IconViewer } from './icon-viewer';

type IconCardProps = {
  app: GalleryApp;
  saved: boolean;
  onToggleSaved: () => void;
};

// hairline edge + contact shadow = crisp. the old inset gloss was what made icons look hazy
const ICON_EDGE =
  "shadow-[0_1px_2px_rgba(0,0,0,0.14),0_10px_18px_-8px_rgba(0,0,0,0.38)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[22%] after:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.3)] after:content-['']";

// fade the mirror out with a mask (not a white overlay) so it works on any background
const REFLECTION_FADE =
  '[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5),transparent)]';

export function IconCard({ app, saved, onToggleSaved }: IconCardProps) {
  const [isViewing, setIsViewing] = useState(false);

  return (
    <li className="group/card relative z-10 min-w-0 px-1 text-center focus-within:z-20 hover:z-20">
      <div className="relative aspect-square">
        {/* mirror sits under the icon; shelf is drawn per row by IconShowcase */}
        {app.iconUrl && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-[9%] top-[82%] z-0 h-[20%] w-[82%] overflow-hidden ${REFLECTION_FADE}`}
          >
            <img
              src={app.iconUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute left-0 top-0 aspect-square w-full scale-y-[-1] rounded-[22%] blur-[2px]"
            />
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsViewing(true)}
          aria-label={`Expand ${app.name} icon`}
          className={`relative z-10 mx-auto block w-[82%] cursor-default rounded-[22%] transition-transform duration-150 ease-out hover:-translate-y-1 active:scale-[0.97] ${ICON_EDGE}`}
        >
          <AppIcon src={app.iconUrl} alt={appIconAltText(app)} name={app.name} className="aspect-square w-full rounded-[22%]" />
        </button>
      </div>
      <p className="pointer-events-none absolute left-1/2 top-0 z-30 max-w-[calc(100%+5rem)] -translate-x-1/2 -translate-y-full truncate rounded-full border border-white/90 bg-white/95 px-3 py-1 text-body-sm font-medium text-card-title opacity-0 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.35),0_3px_8px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-[opacity,translate] duration-150 group-hover/card:-translate-y-[calc(100%+0.5rem)] group-hover/card:opacity-100 group-focus-within/card:-translate-y-[calc(100%+0.5rem)] group-focus-within/card:opacity-100 [@media(hover:none)]:hidden" aria-hidden="true">
        {app.name}
      </p>
      <span className="sr-only">{app.name}, {app.category}</span>
      {isViewing && <IconViewer app={app} saved={saved} onToggleSaved={onToggleSaved} onClose={() => setIsViewing(false)} />}
    </li>
  );
}
