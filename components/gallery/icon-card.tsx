import { AppIcon } from '@/components/ui/app-icon';
import { SaveToggle } from '@/components/ui/save-toggle';
import { appIconAltText } from '@/lib/alt-text';
import type { GalleryApp } from '@/lib/db/gallery';

type IconCardProps = {
  app: GalleryApp;
  saved: boolean;
  onToggleSaved: () => void;
};

export function IconCard({ app, saved, onToggleSaved }: IconCardProps) {
  return (
    <li className="group/card min-w-0 text-center">
      <div className="relative">
        <AppIcon src={app.iconUrl} alt={appIconAltText(app)} name={app.name} className="aspect-square w-full rounded-[22%]" />
        <SaveToggle saved={saved} itemLabel={appIconAltText(app)} onToggle={onToggleSaved} />
      </div>
      <p className="mt-2.5 truncate text-body font-semibold text-card-title" aria-hidden="true">
        {app.name}
      </p>
      <p className="truncate text-body-sm text-muted">{app.category}</p>
    </li>
  );
}
