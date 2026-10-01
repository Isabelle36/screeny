type SaveToggleProps = {
  saved: boolean;
  itemLabel: string;
  onToggle: () => void;
};

// One per card, top-right. Hidden until the card is hovered on pointer devices (the parent marks itself
// `group/card`), but always visible on keyboard focus, on touch screens, and once saved.
// The visible button is 32px; a pseudo-element extends the hit area to 44px for touch.
export function SaveToggle({ saved, itemLabel, onToggle }: SaveToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={`Save ${itemLabel}`}
      className={`absolute right-2.5 top-2.5 z-10 grid size-8 place-items-center rounded-full bg-background/95 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.08)] transition-[opacity,scale] duration-150 ease-out before:absolute before:-inset-1.5 before:content-[''] focus-visible:opacity-100 active:scale-90 [@media(hover:none)]:opacity-100 ${
        saved ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path d="M6 3h12v18l-6-4-6 4z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
