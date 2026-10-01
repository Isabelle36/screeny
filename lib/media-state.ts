// Image loading state for skeletons, kept in the DOM (`data-state` on the image's wrapper) instead of
// React state: hundreds of images settle independently and none of them should cause a re-render.
// CSS in globals.css reacts to it: skeleton sweep while loading, fade-in when loaded, fallback on error.

type MediaState = 'loading' | 'loaded' | 'error';

function settle(image: HTMLImageElement, state: MediaState) {
  const wrapper = image.parentElement;
  if (wrapper) wrapper.dataset.state = state;
}

export const mediaHandlers = {
  onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => settle(event.currentTarget, 'loaded'),
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => settle(event.currentTarget, 'error'),
  // An image can finish (from cache) before React attaches onLoad during hydration — check on mount.
  ref: (image: HTMLImageElement | null) => {
    if (image?.complete) settle(image, image.naturalWidth > 0 ? 'loaded' : 'error');
  },
};
