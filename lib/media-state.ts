type MediaState = 'loading' | 'loaded' | 'error';

function settle(image: HTMLImageElement, state: MediaState) {
  const wrapper = image.parentElement;
  if (wrapper) wrapper.dataset.state = state;
}

export const mediaHandlers = {
  onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => settle(event.currentTarget, 'loaded'),
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => settle(event.currentTarget, 'error'),
  ref: (image: HTMLImageElement | null) => {
    if (image?.complete) settle(image, image.naturalWidth > 0 ? 'loaded' : 'error');
  },
};
