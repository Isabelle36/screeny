'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { openLoginModal } from '@/hooks/use-login-modal';
import { finishSso, isCompletingSso, useIsCompletingSso } from '@/hooks/use-sso-callback';

const BACK_TO_LOGIN = '/?login=1';

function returnToLogin() {
  const url = new URL(window.location.href);
  url.searchParams.delete('login');
  finishSso(url.href);
  openLoginModal();
}

export function SsoCallback() {
  const clerk = useClerk();
  const { isLoaded } = useAuth();
  const isCompleting = useIsCompletingSso();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasStarted.current || !isCompletingSso()) return;
    hasStarted.current = true;

    const navigate = async (destination: string) => {
      if (new URL(destination, window.location.origin).searchParams.has('login')) returnToLogin();
      else finishSso(destination);
    };

    clerk
      .handleRedirectCallback(
        {
          signInUrl: BACK_TO_LOGIN,
          signUpUrl: BACK_TO_LOGIN,
          firstFactorUrl: BACK_TO_LOGIN,
          secondFactorUrl: BACK_TO_LOGIN,
          continueSignUpUrl: BACK_TO_LOGIN,
          verifyEmailAddressUrl: BACK_TO_LOGIN,
        },
        navigate,
      )
      .then(() => {
        if (!clerk.session) returnToLogin();
      })
      .catch(returnToLogin);
  }, [isLoaded, clerk]);

  return isCompleting ? <div id="clerk-captcha" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 empty:hidden" /> : null;
}
