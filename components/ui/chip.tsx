import { CategoryIcon } from './category-icon';

type ChipProps = {
  label: string;
  pressed: boolean;
  onPress: () => void;
  iconCategory?: string;
  size?: 'md' | 'sm';
};

const SIZES = {
  md: {
    chip: 'h-7 gap-1 px-3 text-[0.8125rem] tracking-[-0.01em] lg:h-auto lg:gap-[7px] lg:px-4 lg:py-2 lg:text-body lg:tracking-(--text-body--letter-spacing)',
    idle: 'border-transparent bg-surface text-muted hover:text-foreground lg:border-chip-border lg:bg-chip lg:hover:border-chip-border-hover lg:hover:bg-chip-hover',
    icons: [
      { size: 14, className: 'lg:hidden' },
      { size: 20, className: 'max-lg:hidden' },
    ],
  },
  sm: {
    chip: 'gap-1.5 px-3 py-1.5 text-body-sm',
    idle: 'border-chip-border bg-chip text-muted hover:border-chip-border-hover hover:bg-chip-hover hover:text-foreground',
    icons: [{ size: 16, className: '' }],
  },
};

export function Chip({ label, pressed, onPress, iconCategory, size = 'md' }: ChipProps) {
  const styles = SIZES[size];
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={`group/chip flex shrink-0 items-center rounded-full border font-normal whitespace-nowrap transition-[color,background-color,border-color,scale] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] ${styles.chip} ${
        pressed ? 'border-ink bg-ink text-background' : styles.idle
      }`}
    >
      {iconCategory &&
        styles.icons.map((icon) => (
          <CategoryIcon
            key={icon.size}
            category={iconCategory}
            size={icon.size}
            className={`${icon.className} ${
              pressed ? 'brightness-0 invert' : 'opacity-60 transition-opacity duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover/chip:opacity-100'
            }`}
          />
        ))}
      {label}
    </button>
  );
}
