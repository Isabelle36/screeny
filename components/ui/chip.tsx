import { CategoryIcon } from './category-icon';

type ChipProps = {
  label: string;
  pressed: boolean;
  onPress: () => void;
  iconCategory?: string;
  size?: 'md' | 'sm';
};

const SIZES = {
  md: { chip: 'gap-[7px] px-4 py-2 text-body', icon: 20 },
  sm: { chip: 'gap-1.5 px-3 py-1.5 text-body-sm', icon: 16 },
};

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
          className={pressed ? 'brightness-0 invert' : 'opacity-60 transition-opacity duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover/chip:opacity-100'}
        />
      )}
      {label}
    </button>
  );
}
