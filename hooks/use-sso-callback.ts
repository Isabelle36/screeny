'use client';

import { useSyncExternalStore } from 'react';

export const SSO_CALLBACK_PARAM = 'sso_callback';
const CHANGE_EVENT = 'screeny:sso-callback';

export const isCompletingSso = () => new URLSearchParams(window.location.search).has(SSO_CALLBACK_PARAM);

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('popstate', onChange);
  };
}

export function ssoCallbackUrl(returnTo: string) {
  const url = new URL(returnTo, window.location.origin);
  url.searchParams.set(SSO_CALLBACK_PARAM, '1');
  return `${url.pathname}${url.search}`;
}

export function finishSso(destination: string) {
  const url = new URL(destination, window.location.origin);
  url.searchParams.delete(SSO_CALLBACK_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useIsCompletingSso() {
  return useSyncExternalStore(subscribe, isCompletingSso, () => false);
}
