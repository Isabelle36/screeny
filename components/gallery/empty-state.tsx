import { outlineButton } from '@/components/ui/button-styles';
import { playSound } from '@/lib/sound';

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
        onClick={() => {
          playSound('tap');
          onAction();
        }}
        className={outlineButton()}
      >
        {copy.action}
      </button>
    </div>
  );
}
