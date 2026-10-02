const OUTLINE_BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border font-medium transition-[color,background-color,border-color,opacity,scale] duration-150 ease-[ease] active:scale-[0.97] enabled:hover:bg-ink enabled:hover:text-background disabled:cursor-default disabled:opacity-40 disabled:active:scale-100';

const SURFACES = {
  light: 'border-border-strong bg-background text-foreground enabled:hover:border-ink',
  dark: 'border-transparent bg-background text-foreground enabled:hover:border-white/30',
};

const SIZES = {
  md: 'h-[35px] px-[22px] text-body',
  lg: 'h-10 px-4 text-body',
  sm: 'h-8 px-3.5 text-body-sm',
  icon: 'size-9',
  'icon-md': 'size-[35px]',
  'icon-sm': 'size-8',
  'icon-lg': 'size-11',
  custom: '',
};

type OutlineButtonOptions = { size?: keyof typeof SIZES; surface?: keyof typeof SURFACES };

export function outlineButton({ size = 'md', surface = 'light' }: OutlineButtonOptions = {}) {
  return `${OUTLINE_BASE} ${SURFACES[surface]} ${SIZES[size]}`;
}
