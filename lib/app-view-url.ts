// The open app lives in the URL as /?app=<slug> (see hooks/use-app-view.ts). Kept free of React so
// server-rendered modules (the loading skeleton imports app-card) can build these links too.
export const APP_PARAM = 'app';

export const appViewHref = (slug: string) => `/?${APP_PARAM}=${encodeURIComponent(slug)}`;
