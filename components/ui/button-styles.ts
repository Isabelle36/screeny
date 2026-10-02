const OUTLINE_BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border font-medium bg-[linear-gradient(var(--ink),var(--ink))] bg-no-repeat bg-origin-border bg-[length:0%_100%] bg-left [transition:background-size_450ms_cubic-bezier(0.65,0,0.35,1),color_300ms_ease,border-color_450ms_ease,opacity_150ms_ease,scale_150ms_ease] active:scale-[0.97] enabled:hover:bg-[length:100%_100%] enabled:hover:text-background disabled:cursor-default disabled:opacity-40 disabled:active:scale-100';

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
