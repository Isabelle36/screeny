import { CategoryIcon } from './category-icon';

type ChipProps = {
  label: string;
  pressed: boolean;
  onPress: () => void;
  // Category name whose glyph leads the label.
  iconCategory?: string;
  size?: 'md' | 'sm';
};

const SIZES = {
  md: { chip: 'gap-[7px] px-4 py-2 text-body', icon: 20 },
  sm: { chip: 'gap-1.5 px-3 py-1.5 text-body-sm', icon: 16 },
};

// A toggle filter: real <button> with aria-pressed so screen readers announce selected state.
// Hover lifts the whole tag — background, border, label and icon together — with the same quick 120ms
// color fade as the sidebar links; only the press squeeze moves (hover restraint: no motion on hover).
export function Chip({ label, pressed, onPress, iconCategory, size = 'md' }: ChipProps) {
  const styles = SIZES[size];
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={`group/chip flex shrink-0 items-center rounded-full border font-normal whitespace-nowrap transition-[color,background-color,border-color,scale] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] ${styles.chip} ${
        pressed
          ? 'border-ink bg-ink text-background'
          : 'border-chip-border bg-chip text-muted hover:border-chip-border-hover hover:bg-chip-hover hover:text-foreground'
      }`}
    >
      {iconCategory && (
        <CategoryIcon
          category={iconCategory}
          size={styles.icon}
          // Black glyphs: 60% matches the muted label, 100% matches the hovered label; white on the pressed chip.
          // Same duration and curve as the label's color change, so icon and text move as one.
          className={pressed ? 'brightness-0 invert' : 'opacity-60 transition-opacity duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover/chip:opacity-100'}
        />
      )}
      {label}
    </button>
  );
}
