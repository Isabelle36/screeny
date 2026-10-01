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
// Color changes are instant — chips are clicked constantly, so they don't animate (hover restraint).
export function Chip({ label, pressed, onPress, iconCategory, size = 'md' }: ChipProps) {
  const styles = SIZES[size];
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={`flex shrink-0 items-center rounded-full border font-medium whitespace-nowrap transition-transform duration-150 ease-out active:scale-[0.97] ${styles.chip} ${
        pressed ? 'border-ink bg-ink text-background' : 'border-border bg-surface text-muted hover:text-foreground'
      }`}
    >
      {iconCategory && (
        <CategoryIcon
          category={iconCategory}
          size={styles.icon}
          // Black glyphs: 60% reads as the muted text tone; inverted to white on the dark pressed chip.
          className={pressed ? 'brightness-0 invert' : 'opacity-60'}
        />
      )}
      {label}
    </button>
  );
}
