type EmptyStateProps = {
  variant: 'no-bookmarks' | 'no-matches' | 'empty-library';
  onAction: () => void;
};

const COPY = {
  'no-bookmarks': {
    lines: ['Nothing caught your eye enough to save?', 'well, You know what to do.'],
    action: 'Browse',
  },
  'empty-library': {
    lines: ['The gallery is restocking right now.', 'Check back in a moment.'],
    action: 'Reload',
  },
  'no-matches': {
    lines: ['Nothing matches this filter yet.', 'Try another category.'],
    action: 'Clear filter',
  },
};

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const copy = COPY[variant];
  return (
    <div className="flex flex-col items-center gap-4 py-[min(28vh,240px)] text-center">
      <p className="text-body text-muted">
        {copy.lines[0]}
        <br />
        {copy.lines[1]}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="rounded-full border border-border-strong px-[15px] py-[5px] text-body font-medium text-card-title transition-[color,scale] duration-150 hover:text-foreground active:scale-[0.97]"
      >
        {copy.action}
      </button>
    </div>
  );
}
