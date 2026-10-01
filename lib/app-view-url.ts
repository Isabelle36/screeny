export const APP_PARAM = 'app';

export const appViewHref = (slug: string) => `/?${APP_PARAM}=${encodeURIComponent(slug)}`;
