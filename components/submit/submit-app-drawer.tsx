'use client';

import { useActionState, useEffect, useId } from 'react';
import { Drawer } from 'vaul';
import { submitAppForReview, type SubmitState } from '@/app/actions/submit-for-review';
import { CloseIcon } from '@/components/app/action-icons';
import { outlineButton } from '@/components/ui/button-styles';
import { playSound } from '@/lib/sound';

const INITIAL_STATE: SubmitState = { status: 'idle' };

const FIELD =
  'h-11 w-full rounded-[12px] bg-background px-3.5 text-body text-foreground shadow-[inset_0_0_0_1px_var(--border-strong)] placeholder:text-muted aria-invalid:shadow-[inset_0_0_0_1.5px_#b42318]';
const LABEL = 'text-body-sm font-medium text-card-title';
const PRIMARY_BUTTON =
  'inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-ink text-body font-medium text-background transition-[background-color,scale] duration-150 ease-[ease] hover:bg-black active:scale-[0.98] disabled:cursor-default disabled:opacity-60';

export function SubmitAppDrawer({ triggerClassName }: { triggerClassName: string }) {
  return (
    <Drawer.Root onOpenChange={(open) => playSound(open ? 'drawer-open' : 'drawer-close')}>
      <Drawer.Trigger className={triggerClassName}>Submit an app</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[6px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-t-[28px] bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_-24px_64px_-12px_rgba(0,0,0,0.22)] outline-none sm:bottom-6 sm:w-[calc(100%-3rem)] sm:rounded-[28px] sm:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_32px_80px_-16px_rgba(0,0,0,0.3)]">
          <SubmitBanner />
          <SubmitForm />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SubmitBanner() {
  return (
    <div className="relative h-[132px] shrink-0 overflow-hidden sm:h-[156px]">
      <img
        src="/figma/modal-bg.webp"
        alt=""
        width={1490}
        height={802}
        className="absolute inset-0 size-full object-cover [mask-image:linear-gradient(to_bottom,#000_45%,transparent)]"
      />
      <img
        src="/figma/modal-wordmark.svg"
        alt=""
        width={599}
        height={161}
        className="absolute left-1/2 top-[44%] h-auto w-[124px] -translate-x-1/2 -translate-y-1/2 sm:w-[144px]"
      />
      <div className="absolute inset-x-0 top-2.5 sm:hidden">
        <Drawer.Handle className="bg-black/30!" />
      </div>
      <Drawer.Close aria-label="Close" className={`${outlineButton({ size: 'icon-md' })} absolute right-4 top-4`}>
        <CloseIcon />
      </Drawer.Close>
    </div>
  );
}

function SubmitForm() {
  const [state, formAction, isPending] = useActionState(submitAppForReview, INITIAL_STATE);
  const urlId = useId();
  const nameId = useId();
  const errorId = useId();

  useEffect(() => {
    if (state.status === 'submitted') playSound('success');
    if (state.status === 'error') playSound('error');
  }, [state]);

  if (state.status === 'submitted') {
    return (
      <div className="min-h-0 overflow-y-auto px-6 pb-7 sm:px-8 sm:pb-8">
        <Drawer.Title className="text-title font-semibold text-card-title">
          {state.alreadyListed ? 'Already in the gallery' : 'Thanks, we’ve got it'}
        </Drawer.Title>
        <Drawer.Description className="mt-1.5 text-body text-muted">
          {state.alreadyListed
            ? `${state.appName ?? 'This app'} is already on Screeny.`
            : `${state.appName ?? 'Your app'} is in the queue. Once it’s reviewed, it’ll show up in the gallery.`}
        </Drawer.Description>
        <Drawer.Close className={`${PRIMARY_BUTTON} mt-7`}>Done</Drawer.Close>
      </div>
    );
  }

  const hasError = state.status === 'error';

  return (
    <form action={formAction} className="min-h-0 overflow-y-auto px-6 pb-7 sm:px-8 sm:pb-8">
      <Drawer.Title className="text-title font-semibold text-card-title">Get your app on Screeny</Drawer.Title>
      <Drawer.Description className="mt-1.5 text-body text-muted">
        Paste its App Store link. Every app is reviewed by hand before it joins the gallery.
      </Drawer.Description>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor={urlId} className={LABEL}>
            App Store link <span aria-hidden="true">*</span>
          </label>
          <input
            id={urlId}
            name="appStoreUrl"
            type="url"
            inputMode="url"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="https://apps.apple.com/app/id…"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            className={`${FIELD} mt-1.5`}
          />
          {hasError && (
            <p id={errorId} role="alert" className="mt-1.5 text-body-sm text-[#b42318]">
              {state.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={nameId} className={LABEL}>
            App name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id={nameId} name="appName" maxLength={120} autoComplete="off" placeholder="e.g. Flighty, Headspace" className={`${FIELD} mt-1.5`} />
        </div>
      </div>

      <button type="submit" disabled={isPending} className={`${PRIMARY_BUTTON} mt-6`}>
        {isPending ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  );
}
