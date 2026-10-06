'use client';

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from '@/components/app/action-icons';
import { outlineButton } from '@/components/ui/button-styles';
import { FIELD, FIELD_RING, FIELD_RING_FOCUS, FIELD_RING_INVALID } from '@/components/ui/field-styles';
import { peekLoginResume, useLoginModal } from '@/hooks/use-login-modal';
import { ssoCallbackUrl } from '@/hooks/use-sso-callback';
import { playSound } from '@/lib/sound';

type Step = 'email' | 'code';
type Flow = 'signIn' | 'signUp';
type ClerkApiError = { code: string; message: string; longMessage?: string };
type ClerkFailure = (ClerkApiError & { errors?: ClerkApiError[] }) | null;

const firstError = (error: NonNullable<ClerkFailure>): ClerkApiError => error.errors?.[0] ?? error;

const FRIENDLY_ERRORS: Record<string, string> = {
  form_code_incorrect: 'That code isn’t right. Check the email and try again.',
  verification_expired: 'That code has expired. Send a new one.',
  verification_failed: 'Too many attempts. Send a new code and try again.',
  form_param_format_invalid: 'Enter a valid email address.',
  form_identifier_exists: 'That email already has an account. Try logging in again.',
};

const describeError = (error: NonNullable<ClerkFailure>) => {
  const detail = firstError(error);
  return FRIENDLY_ERRORS[detail.code] ?? detail.longMessage ?? detail.message;
};

const PRIMARY =
  'inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-ink px-5 text-body font-medium text-background transition-[background-color,scale] duration-150 ease-[ease] hover:bg-black active:scale-[0.97] disabled:cursor-default disabled:opacity-60';
const QUIET =
  'inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-4 text-body font-medium text-muted transition-colors duration-[120ms] hover:bg-surface hover:text-foreground';
const LINK = 'cursor-pointer rounded-sm font-medium text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground disabled:cursor-default disabled:opacity-50';

export function LoginModal() {
  const { isOpen, open, close } = useLoginModal();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('login')) return;
      params.delete('login');
      const query = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      open();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      playSound('modal-open');
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="login-title"
      onClose={() => {
        if (isOpen) playSound('modal-close');
        close();
      }}
      onClick={(event) => event.target === event.currentTarget && dialogRef.current?.close()}
      className="login-modal m-auto max-h-[calc(100dvh-2rem)] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[24px] bg-background p-0 text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_32px_80px_-16px_rgba(0,0,0,0.3)] backdrop:bg-black/25 backdrop:backdrop-blur-[6px]"
    >
      {isOpen && <LoginPanel onDone={() => dialogRef.current?.close()} />}
    </dialog>
  );
}

function LoginPanel({ onDone }: { onDone: () => void }) {
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const { signUp } = useSignUp();
  const [resume] = useState(peekLoginResume);
  const pendingEmail = resume && 'pendingEmail' in resume ? resume.pendingEmail : null;
  const [step, setStep] = useState<Step>(pendingEmail ? 'code' : 'email');
  const [flow, setFlow] = useState<Flow>(pendingEmail ? 'signUp' : 'signIn');
  const [email, setEmail] = useState(pendingEmail ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(resume && 'message' in resume ? resume.message : null);
  const [isBusy, setIsBusy] = useState(false);
  const [redirecting, setRedirecting] = useState<'oauth_google' | 'oauth_x' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  useEffect(() => {
    const target = step === 'email' ? emailRef.current : codeRef.current;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches || step === 'code') target?.focus();
  }, [step]);

  const fail = (failure: ClerkFailure, fallback = 'Something went wrong. Please try again.') => {
    playSound('error');
    setError(failure ? describeError(failure) : fallback);
  };

  const run = async (task: () => Promise<void>) => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      await task();
    } catch {
      fail(null);
    } finally {
      setIsBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      const address = email.trim();
      const created = await signIn.create({ identifier: address });
      if (!created.error) {
        const sent = await signIn.emailCode.sendCode();
        if (sent.error) return fail(sent.error);
        setFlow('signIn');
        setStep('code');
        return;
      }
      if (firstError(created.error).code !== 'form_identifier_not_found') return fail(created.error);
      const registered = await signUp.create({ emailAddress: address });
      if (registered.error) return fail(registered.error);
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) return fail(sent.error);
      setFlow('signUp');
      setStep('code');
    });

  const resendCode = () =>
    run(async () => {
      const sent = flow === 'signIn' ? await signIn.emailCode.sendCode() : await signUp.verifications.sendEmailCode();
      if (sent.error) return fail(sent.error);
      setCode('');
      setNotice(`We sent a new code to ${email.trim()}.`);
    });

  const verifyCode = (value: string) =>
    run(async () => {
      const verified =
        flow === 'signIn' ? await signIn.emailCode.verifyCode({ code: value }) : await signUp.verifications.verifyEmailCode({ code: value });
      if (verified.error) return fail(verified.error);
      const finalized = flow === 'signIn' ? await signIn.finalize() : await signUp.finalize();
      if (finalized.error) return fail(finalized.error);
      playSound('success');
      onDone();
    });

  const continueWith = (strategy: 'oauth_google' | 'oauth_x') =>
    run(async () => {
      setRedirecting(strategy);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const classicSignIn = clerk.client?.signIn;
      if (!classicSignIn) {
        setRedirecting(null);
        fail(null);
        return;
      }
      await classicSignIn.authenticateWithRedirect({ strategy, redirectUrl: ssoCallbackUrl(returnTo), redirectUrlComplete: returnTo });
      await new Promise((resolve) => window.setTimeout(resolve, 6000));
      setRedirecting(null);
      fail(null, 'Couldn’t open the sign-in page. Please try again.');
    });

  useEffect(() => {
    const resetAfterBackNavigation = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setIsBusy(false);
      setRedirecting(null);
    };
    window.addEventListener('pageshow', resetAfterBackNavigation);
    return () => window.removeEventListener('pageshow', resetAfterBackNavigation);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 'email') sendCode();
    else if (code.length === 6) verifyCode(code);
  };

  return (
    <form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto">
      <LoginVisual />
      <button
        type="button"
        onClick={onDone}
        aria-label="Close"
        className={`${outlineButton({ size: 'icon-md' })} absolute right-3 top-3 z-10`}
      >
        <CloseIcon />
      </button>

      <div className="relative -mt-3 px-6 pb-6 text-center sm:px-8">
        <h2 id="login-title" className="text-title font-semibold text-black-700">
          {step === 'email' ? 'Log in to Screeny' : 'Check your email'}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[32ch] text-pretty text-body text-muted">
          {step === 'email' ? (
            'Welcome back. Access your saved screenshots and icons on any device.'
          ) : (
            <>
              Enter the 6-digit code we sent to <span className="font-medium text-black-600">{email.trim()}</span>.
            </>
          )}
        </p>
      </div>

      <div className="border-y border-white-200 bg-white-50 px-6 py-5 sm:px-8">
        {step === 'email' ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => continueWith('oauth_x')}
                disabled={isBusy}
                aria-label="Continue with X"
                className={`${outlineButton({ size: 'custom' })} h-10 w-full text-body`}
              >
                {redirecting === 'oauth_x' ? <span className="text-body-sm">Opening X…</span> : <XLogo />}
              </button>
              <button
                type="button"
                onClick={() => continueWith('oauth_google')}
                disabled={isBusy}
                aria-label="Continue with Google"
                className={`${outlineButton({ size: 'custom' })} h-10 w-full text-body`}
              >
                {redirecting === 'oauth_google' ? <span className="text-body-sm">Opening Google…</span> : <GoogleLogo />}
              </button>
            </div>
            <p className="my-4 flex items-center gap-3 text-body-sm text-muted before:h-px before:flex-1 before:bg-white-200 before:content-[''] after:h-px after:flex-1 after:bg-white-200 after:content-['']">
              or use email
            </p>
            <label htmlFor="login-email" className="sr-only">
              Email address
            </label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={FIELD}
            />
          </>
        ) : (
          <>
            <label htmlFor="login-code" className="sr-only">
              6-digit code
            </label>
            <CodeInput
              inputRef={codeRef}
              value={code}
              isInvalid={Boolean(error)}
              describedBy={error ? errorId : undefined}
              onChange={(digits) => {
                setCode(digits);
                if (digits.length === 6) verifyCode(digits);
              }}
            />
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-body-sm text-muted">
              <button type="button" onClick={resendCode} disabled={isBusy} className={LINK}>
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                  setNotice(null);
                }}
                className={LINK}
              >
                Use a different email
              </button>
            </p>
          </>
        )}
        <div id="clerk-captcha" className="mt-3 flex justify-center empty:hidden" />
        {error && (
          <p id={errorId} role="alert" className="mt-2.5 text-center text-body-sm text-[#b42318]">
            {error}
          </p>
        )}
        <p aria-live="polite" className="mt-2.5 text-center text-body-sm text-muted empty:hidden">
          {notice}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-4 sm:px-8">
        <button type="button" onClick={onDone} className={QUIET}>
          Cancel
        </button>
        <button type="submit" disabled={isBusy || (step === 'code' && code.length < 6)} className={PRIMARY}>
          {step === 'email' ? (isBusy ? 'Sending…' : 'Send code') : isBusy ? 'Checking…' : 'Log in'}
        </button>
      </div>
    </form>
  );
}

const CODE_LENGTH = 6;

type CodeInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  isInvalid: boolean;
  describedBy?: string;
  onChange: (digits: string) => void;
};

function CodeInput({ inputRef, value, isInvalid, describedBy, onChange }: CodeInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const activeIndex = Math.min(value.length, CODE_LENGTH - 1);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id="login-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={CODE_LENGTH}
        required
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className="absolute inset-0 z-10 size-full cursor-text bg-transparent text-body text-transparent caret-transparent outline-none selection:bg-transparent"
      />
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const ring = isInvalid ? FIELD_RING_INVALID : isFocused && index === activeIndex ? FIELD_RING_FOCUS : FIELD_RING;
          return (
            <div
              key={index}
              className={`grid h-12 place-items-center rounded-[10px] bg-background text-[1.25rem] font-medium tabular-nums text-black-700 transition-shadow duration-150 ease-out ${ring}`}
            >
              {value[index] ?? ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EASED_FADE =
  'linear-gradient(to bottom, #000 0%, #000 40%, rgb(0 0 0 / 0.96) 47.5%, rgb(0 0 0 / 0.85) 55%, rgb(0 0 0 / 0.69) 62.5%, rgb(0 0 0 / 0.5) 70%, rgb(0 0 0 / 0.31) 77.5%, rgb(0 0 0 / 0.15) 85%, rgb(0 0 0 / 0.04) 92.5%, transparent 100%)';
const BLUR_LAYERS = [
  { blur: 'backdrop-blur-[1px]', mask: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 50%, transparent 75%)' },
  { blur: 'backdrop-blur-[2px]', mask: 'linear-gradient(to bottom, transparent 25%, #000 50%, #000 75%, transparent 100%)' },
  { blur: 'backdrop-blur-[4px]', mask: 'linear-gradient(to bottom, transparent 50%, #000 75%, #000 100%)' },
  { blur: 'backdrop-blur-[8px]', mask: 'linear-gradient(to bottom, transparent 75%, #000 100%)' },
];

function LoginVisual() {
  return (
    <div aria-hidden="true" className="relative h-[210px] shrink-0 select-none overflow-hidden sm:h-[236px]">
      <img
        src="/figma/login-visual-v2.webp"
        alt=""
        width={1200}
        height={662}
        className="absolute inset-0 size-full object-cover object-[50%_35%]"
        style={{ maskImage: EASED_FADE, WebkitMaskImage: EASED_FADE }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5">
        {BLUR_LAYERS.map(({ blur, mask }) => (
          <div key={blur} className={`absolute inset-0 ${blur}`} style={{ maskImage: mask, WebkitMaskImage: mask }} />
        ))}
      </div>
    </div>
  );
}

function XLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[17px]" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}
