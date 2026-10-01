// FLIP (First, Last, Invert, Play) for layout changes we want to animate without animating layout.
// Instead of tweening width every frame (a full reflow of the grid per frame), the layout changes once,
// then each element is transformed back to where it was and animated home with `transform` only —
// compositor work, no React renders.
//
// Mark elements with `data-flip`:
//   data-flip="scale"  — moves and resizes (card frames: images scale cleanly)
//   data-flip="move"   — moves only (text rows, so type never stretches)
// Only elements on screen are animated; off-screen ones simply land in place.

const MOVE_EASING = 'cubic-bezier(0.645, 0.045, 0.355, 1)'; // ease-in-out: things already on screen moving
export const FLIP_DURATION_MS = 280;

type Snapshot = { element: HTMLElement; rect: DOMRect };

function isOnScreen(rect: DOMRect) {
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
}

export function captureFlip(): Snapshot[] {
  return [...document.querySelectorAll<HTMLElement>('[data-flip]')]
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => isOnScreen(rect));
}

export function playFlip(snapshots: Snapshot[]) {
  for (const { element, rect: first } of snapshots) {
    const last = element.getBoundingClientRect();
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const scaleX = first.width / last.width;
    const scaleY = first.height / last.height;
    const shouldScale = element.dataset.flip === 'scale';
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5 && (!shouldScale || Math.abs(scaleX - 1) < 0.002)) continue;

    const from = shouldScale ? `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})` : `translate(${deltaX}px, ${deltaY}px)`;
    element.animate([{ transform: from, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], {
      duration: FLIP_DURATION_MS,
      easing: MOVE_EASING,
    });
  }
}
