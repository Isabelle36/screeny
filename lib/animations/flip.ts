// FLIP (First, Last, Invert, Play) for layout changes we want to animate without animating layout.
// The layout changes once; each element is then transformed back to where it was and sprung home with
// `transform` only — a Web Animation, so it runs on the compositor with no React renders.
//
// Why WAAPI and not motion's animate(): the inverted first frame must be on screen *before* the browser
// paints the new layout. element.animate() applies its first keyframe in the same frame; motion's
// animate() writes `transform: none` and starts a frame later, which flashed every card at its final
// size for one frame (the "clipped glitch").
//
// Markup:
//   data-flip-group   — a unit that's on or off screen together (a card, the chip row). Only groups on
//                       screen are measured: reading the rect of anything inside an off-screen
//                       `content-visibility: auto` card forces the browser to lay that card out, and doing
//                       that for ~200 cards was the multi-second stall.
//   data-flip="scale" — moves and resizes (card frames: images scale cleanly)
//   data-flip="move"  — moves only (text rows, so type never stretches)

export const FLIP_DURATION_MS = 300;

// A critically damped spring (no bounce) sampled into a CSS linear() easing:
// progress(t) = 1 − (1 + ωt)·e^(−ωt), with ω chosen so it settles (99.5%) right at FLIP_DURATION_MS.
const SPRING_EASING = (() => {
  const omega = 7.43; // (1 + x)e^(−x) = 0.005 at x ≈ 7.43, in units of the whole duration
  const samples = Array.from({ length: 24 }, (_, index) => {
    const t = index / 23;
    return (1 - (1 + omega * t) * Math.exp(-omega * t)).toFixed(4);
  });
  samples[samples.length - 1] = '1';
  return `linear(${samples.join(', ')})`;
})();

type Snapshot = { element: HTMLElement; group: HTMLElement; rect: DOMRect };

function isOnScreen(rect: DOMRect) {
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
}

export function captureFlip(): Snapshot[] {
  const snapshots: Snapshot[] = [];
  for (const group of document.querySelectorAll<HTMLElement>('[data-flip-group]')) {
    if (!isOnScreen(group.getBoundingClientRect())) continue;
    const targets = group.matches('[data-flip]') ? [group] : group.querySelectorAll<HTMLElement>('[data-flip]');
    for (const element of targets) snapshots.push({ element, group, rect: element.getBoundingClientRect() });
  }
  return snapshots;
}

export function playFlip(snapshots: Snapshot[]) {
  for (const { element, group, rect: first } of snapshots) {
    const last = element.getBoundingClientRect();
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const shouldScale = element.dataset.flip === 'scale';
    const scaleX = shouldScale ? first.width / last.width : 1;
    const scaleY = shouldScale ? first.height / last.height : 1;
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5 && Math.abs(scaleX - 1) < 0.002) continue;

    // While a card animates, lift its paint containment so a frame scaling past the card's box isn't cropped.
    group.style.contentVisibility = 'visible';
    const animation = element.animate(
      [
        { transformOrigin: '0 0', transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})` },
        { transformOrigin: '0 0', transform: 'translate(0px, 0px) scale(1, 1)' },
      ],
      { duration: FLIP_DURATION_MS, easing: SPRING_EASING },
    );
    animation.onfinish = animation.oncancel = () => {
      group.style.contentVisibility = '';
    };
  }
}
