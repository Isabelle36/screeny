import { outlineButton } from './button-styles';

type SaveToggleProps = {
  saved: boolean;
  itemLabel: string;
  onToggle: () => void;
};

export function SaveToggle({ saved, itemLabel, onToggle }: SaveToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={`Save ${itemLabel}`}
      className={`${outlineButton({ size: 'icon-sm' })} absolute right-2.5 top-2.5 z-10 before:absolute before:-inset-1.5 before:content-[''] focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${
        saved ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path d="M6 3h12v18l-6-4-6 4z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
