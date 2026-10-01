import { CheckIcon, CopyIcon, DownloadIcon } from '@/components/app/action-icons';
import { AppIcon } from '@/components/ui/app-icon';
import { SaveToggle } from '@/components/ui/save-toggle';
import { useCopyImage } from '@/hooks/use-copy-image';
import { appIconAltText } from '@/lib/alt-text';
import type { GalleryApp } from '@/lib/db/gallery';
import { downloadImage } from '@/lib/image-actions';

type IconCardProps = {
  app: GalleryApp;
  saved: boolean;
  onToggleSaved: () => void;
};

const ICON_ACTION = `relative grid size-8 cursor-pointer place-items-center rounded-full bg-background/95 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.08)] transition-[scale] duration-150 ease-out before:absolute before:-inset-1.5 before:content-[''] active:scale-90`;

export function IconCard({ app, saved, onToggleSaved }: IconCardProps) {
  const { state: copyState, copy } = useCopyImage();

  return (
    <li className="group/card min-w-0 text-center">
      <div className="relative">
        <AppIcon src={app.iconUrl} alt={appIconAltText(app)} name={app.name} className="aspect-square w-full rounded-[22%]" />
        <SaveToggle saved={saved} itemLabel={appIconAltText(app)} onToggle={onToggleSaved} />
        {app.iconUrl && (
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-2 opacity-0 transition-opacity duration-150 ease-out focus-within:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100">
            <button type="button" onClick={() => copy(app.iconUrl)} aria-label={`Copy ${app.name} icon`} className={ICON_ACTION}>
              {copyState === 'copied' ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
            </button>
            <button
              type="button"
              onClick={() => downloadImage(app.iconUrl, `${app.slug}-icon.webp`)}
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
    </li>
  );
}
