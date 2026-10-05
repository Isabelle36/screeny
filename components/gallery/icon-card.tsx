import { useState } from 'react';
import { CheckIcon, CopyIcon, DownloadIcon } from '@/components/app/action-icons';
import { AppIcon } from '@/components/ui/app-icon';
import { outlineButton } from '@/components/ui/button-styles';
import { SaveToggle } from '@/components/ui/save-toggle';
import { useCopyImage } from '@/hooks/use-copy-image';
import { appIconAltText } from '@/lib/alt-text';
import type { GalleryApp } from '@/lib/db/gallery';
import { downloadImage } from '@/lib/image-actions';
import { playSound } from '@/lib/sound';
import { IconViewer } from './icon-viewer';

type IconCardProps = {
  app: GalleryApp;
  saved: boolean;
  onToggleSaved: () => void;
};

const ICON_ACTION = `${outlineButton({ size: 'icon-sm' })} relative before:absolute before:-inset-1.5 before:content-['']`;

export function IconCard({ app, saved, onToggleSaved }: IconCardProps) {
  const { state: copyState, copy } = useCopyImage();
  const [isViewing, setIsViewing] = useState(false);

  return (
    <li className="group/card min-w-0 text-center">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsViewing(true)}
          aria-label={`View ${app.name} icon`}
          className="block w-full cursor-zoom-in rounded-[22%] transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <AppIcon src={app.iconUrl} alt={appIconAltText(app)} name={app.name} className="aspect-square w-full rounded-[22%]" />
        </button>
        <SaveToggle
          saved={saved}
          itemLabel={appIconAltText(app)}
          onToggle={onToggleSaved}
          className={saved ? '[@media(hover:none)]:pointer-events-none' : '[@media(hover:none)]:hidden'}
        />
        {app.iconUrl && (
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-2 opacity-0 transition-opacity duration-150 ease-out focus-within:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:hidden">
            <button type="button" onClick={() => copy(app.iconUrl)} aria-label={`Copy ${app.name} icon`} className={ICON_ACTION}>
              {copyState === 'copied' ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('save');
                downloadImage(app.iconUrl, `${app.slug}-icon.webp`);
              }}
              aria-label={`Download ${app.name} icon`}
              className={ICON_ACTION}
            >
              <DownloadIcon size={15} />
            </button>
          </div>
        )}
      </div>
      <p className="mt-2.5 truncate text-body font-semibold text-card-title" aria-hidden="true">
        {app.name}
      </p>
      <p className="truncate text-body-sm text-muted">{app.category}</p>
      <span aria-live="polite" className="sr-only">
        {copyState === 'copied' ? `${app.name} icon copied` : copyState === 'failed' ? `Couldn't copy the ${app.name} icon` : ''}
      </span>
      {isViewing && <IconViewer app={app} saved={saved} onToggleSaved={onToggleSaved} onClose={() => setIsViewing(false)} />}
    </li>
  );
}
