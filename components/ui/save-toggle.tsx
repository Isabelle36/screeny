import { outlineButton } from './button-styles';

type SaveToggleProps = {
  saved: boolean;
  itemLabel: string;
  onToggle: () => void;
  disabled?: boolean;
  pending?: boolean;
  className?: string;
};

export function SaveToggle({
  saved,
  itemLabel,
  onToggle,
  disabled = false,
  pending = false,
  className = '',
}: SaveToggleProps) {
  const label = pending ? `${saved ? 'Saving' : 'Removing'} ${itemLabel}` : `${saved ? 'Remove' : 'Save'} ${itemLabel}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || pending}
      aria-pressed={saved}
      aria-busy={pending || undefined}
      aria-label={label}
      style={pending ? { opacity: 1 } : undefined}
      className={`${outlineButton({ size: 'icon-sm' })} absolute right-2.5 top-2.5 z-10 before:absolute before:-inset-1.5 before:content-[''] focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${
        saved || pending ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
      } ${
        pending ? 'ring-2 ring-ink/15 ring-offset-1' : ''
      } ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`size-4 transition-transform duration-150 ${saved ? 'scale-105' : 'scale-100'}`}
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M6 3h12v18l-6-4-6 4z" strokeLinejoin="round" />
      </svg>
      {pending && <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-full border border-transparent border-t-ink/60 motion-safe:animate-spin" />}
    </button>
  );
}
