export const FLIP_DURATION_MS = 300;

const SPRING_EASING = (() => {
  const omega = 7.43;
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
