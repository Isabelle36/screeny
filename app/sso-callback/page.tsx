import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

const BACK_TO_LOGIN = '/?login=1';

export default function SSOCallbackPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <p role="status" className="text-body text-muted">
        Signing you in…
      </p>
      <AuthenticateWithRedirectCallback
        signInUrl={BACK_TO_LOGIN}
        signUpUrl={BACK_TO_LOGIN}
        firstFactorUrl={BACK_TO_LOGIN}
        secondFactorUrl={BACK_TO_LOGIN}
        continueSignUpUrl={BACK_TO_LOGIN}
        verifyEmailAddressUrl={BACK_TO_LOGIN}
      />
      <div id="clerk-captcha" />
    </main>
  );
}
