const MIN_COLUMN_WIDTH = {
  cards: 'grid-cols-1 gap-x-[2vw] gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-[65px]',
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
