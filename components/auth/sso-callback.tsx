'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { openLoginModalToResume, type LoginResume } from '@/hooks/use-login-modal';
import { finishSso, isCompletingSso, useIsCompletingSso } from '@/hooks/use-sso-callback';

const BACK_TO_LOGIN = '/?login=1';

const describeIncompleteSignUp = (missingFields: string[]) =>
  missingFields.length > 0
    ? `We couldn’t finish creating your account (missing ${missingFields.join(', ').replaceAll('_', ' ')}). Try again or continue with email.`
    : 'We couldn’t finish signing you in. Try again or continue with email.';

function returnToLogin(request: LoginResume) {
  const url = new URL(window.location.href);
  url.searchParams.delete('login');
  finishSso(url.href);
  openLoginModalToResume(request);
}

async function completeTransfer(clerk: ReturnType<typeof useClerk>) {
  const client = clerk.client;
  if (!client) return false;
  const needsNewAccount = client.signIn.firstFactorVerification.status === 'transferable';
  const externalAccount = client.signUp.verifications.externalAccount;
  const hasExistingAccount = externalAccount.status === 'transferable' && externalAccount.error?.code === 'external_account_exists';
  if (!needsNewAccount && !hasExistingAccount) return false;
  const attempt = needsNewAccount ? await client.signUp.create({ transfer: true }) : await client.signIn.create({ transfer: true });
  if (attempt.status !== 'complete' || !attempt.createdSessionId) return false;
  await clerk.setActive({ session: attempt.createdSessionId });
  return true;
}

const SESSION_WAIT_MS = 5000;

function waitForSession(clerk: ReturnType<typeof useClerk>) {
  if (clerk.session) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    let isSettled = false;
    let unsubscribe = () => {};
    const settle = (hasSession: boolean) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timer);
      queueMicrotask(() => unsubscribe());
      resolve(hasSession);
    };
    const timer = window.setTimeout(() => settle(Boolean(clerk.session)), SESSION_WAIT_MS);
    unsubscribe = clerk.addListener(({ session }) => {
      if (session) settle(true);
    });
  });
}

export function SsoCallback() {
  const clerk = useClerk();
  const { isLoaded } = useAuth();
  const isCompleting = useIsCompletingSso();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasStarted.current || !isCompletingSso()) return;
    hasStarted.current = true;

    let hasReturnedToLogin = false;
    const backToLogin = async () => {
      if (hasReturnedToLogin) return;
      hasReturnedToLogin = true;
      const transferred = await completeTransfer(clerk).catch((error: unknown) => {
        console.warn('[auth] Account transfer failed', error);
        return false;
      });
      if (transferred) return finishSso(window.location.href);
      const signUp = clerk.client?.signUp;
      console.warn('[auth] Sign-in did not complete', {
        signUpStatus: signUp?.status,
        missingFields: signUp?.missingFields,
        unverifiedFields: signUp?.unverifiedFields,
        signInStatus: clerk.client?.signIn?.status,
      });
      const pendingEmail = signUp?.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address') ? signUp.emailAddress : null;
      if (signUp && pendingEmail) {
        const prepared = await signUp.prepareEmailAddressVerification({ strategy: 'email_code' }).then(
          () => true,
          () => false,
        );
        if (prepared) return returnToLogin({ pendingEmail });
      }
      returnToLogin({ message: describeIncompleteSignUp(signUp?.status === 'missing_requirements' ? signUp.missingFields : []) });
    };

    const navigate = async (destination: string) => {
      if (new URL(destination, window.location.origin).searchParams.has('login')) await backToLogin();
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
      .then(() => waitForSession(clerk))
      .then((hasSession) => {
        if (!hasSession) return backToLogin();
      })
      .catch((error: unknown) => {
        console.warn('[auth] Sign-in callback failed', error);
        return backToLogin();
      });
  }, [isLoaded, clerk]);

  return isCompleting ? <div id="clerk-captcha" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 empty:hidden" /> : null;
}
