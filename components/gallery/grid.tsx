// App cards: always three across at desktop width (Figma rhythm: 68px columns, 65px rows). The column
// count never changes when the sidebar opens or closes — the cards scale with the space instead.
const MIN_COLUMN_WIDTH = {
  cards: 'grid-cols-1 gap-x-[clamp(24px,4vw,68px)] gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-[65px]',
  // Seven across at desktop width — icons are dense, so more per row would turn into noise.
  icons: 'grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
};

type GridProps = {
  variant: keyof typeof MIN_COLUMN_WIDTH;
  label: string;
  children: React.ReactNode;
};

export function Grid({ variant, label, children }: GridProps) {
  return (
    <ul aria-label={label} className={`grid ${MIN_COLUMN_WIDTH[variant]}`}>
      {children}
    </ul>
  );
}
