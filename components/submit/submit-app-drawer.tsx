'use client';

import { useActionState, useEffect, useId } from 'react';
import { Drawer } from 'vaul';
import { submitAppForReview, type SubmitState } from '@/app/actions/submit-for-review';
import { playPatchSound, playSound } from '@/lib/sound';
import { SeigaihaShader } from './seigaiha-shader';

const INITIAL_STATE: SubmitState = { status: 'idle' };

const FIELD =
  'h-11 w-full rounded-[12px] bg-background px-3.5 text-body text-foreground shadow-[inset_0_0_0_1px_var(--card-border)] placeholder:text-muted aria-invalid:shadow-[inset_0_0_0_1.5px_#b42318]';
const PRIMARY_BUTTON =
  'inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-foreground text-body font-medium text-background transition-opacity duration-[120ms] hover:opacity-85 disabled:cursor-default disabled:opacity-60';

export function SubmitAppDrawer({ triggerClassName }: { triggerClassName: string }) {
  return (
    <Drawer.Root onOpenChange={(open) => playSound(open ? 'open' : 'close')}>
      <Drawer.Trigger className={triggerClassName}>Submit an app</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[6px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[28px] bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_-24px_64px_-12px_rgba(0,0,0,0.22)] outline-none">
          <div className="relative shrink-0">
            <SeigaihaShader className="h-[132px] w-full [mask-image:linear-gradient(to_bottom,black_62%,transparent)]" />
            <div className="absolute inset-x-0 top-3">
              <Drawer.Handle className="bg-black/25!" />
            </div>
          </div>
          <SubmitForm />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SubmitForm() {
  const [state, formAction, isPending] = useActionState(submitAppForReview, INITIAL_STATE);
  const urlId = useId();
  const nameId = useId();
  const errorId = useId();

  useEffect(() => {
    if (state.status === 'submitted') playPatchSound('success');
  }, [state]);

  if (state.status === 'submitted') {
    return (
      <div className="min-h-0 overflow-y-auto px-6 pb-8 pt-1 sm:px-8">
        <Drawer.Title className="text-title font-semibold text-card-title">
          {state.alreadyListed ? 'Already in the gallery' : 'Thanks, we’ve got it'}
        </Drawer.Title>
        <Drawer.Description className="mt-2 text-body text-muted">
          {state.alreadyListed
            ? `${state.appName ?? 'This app'} is already on Screeny.`
            : `We’ll review ${state.appName ?? 'your app'}, and once it’s approved we’ll add it to the gallery.`}
        </Drawer.Description>
        <Drawer.Close className={`${PRIMARY_BUTTON} mt-6`}>Done</Drawer.Close>
      </div>
    );
  }

  const hasError = state.status === 'error';

  return (
    <form action={formAction} className="min-h-0 overflow-y-auto px-6 pb-8 pt-1 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-body-sm font-medium uppercase tracking-[0.08em] text-muted">Submit</p>
          <Drawer.Title className="mt-1 text-title font-semibold text-card-title">Get your app on Screeny</Drawer.Title>
        </div>
        <Drawer.Close className="mt-1 inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-body-sm font-medium text-card-title transition-colors duration-[120ms] hover:bg-surface">
          Close
          <kbd className="palette-kbd">Esc</kbd>
        </Drawer.Close>
      </div>
      <Drawer.Description className="mt-2 text-body text-muted">
        Share your App Store link. We’ll review it, and once it’s approved we’ll add your app to the gallery.
      </Drawer.Description>

      <div className="mt-6 space-y-4 rounded-[20px] bg-card-frame p-4 shadow-[inset_0_0_0_1px_var(--card-border)] sm:p-5">
        <div>
          <label htmlFor={urlId} className="text-body-sm font-medium text-card-title">
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
          <label htmlFor={nameId} className="text-body-sm font-medium text-card-title">
            App name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id={nameId} name="appName" maxLength={120} autoComplete="off" placeholder="e.g. Flighty, Headspace" className={`${FIELD} mt-1.5`} />
        </div>
        <button type="submit" disabled={isPending} className={PRIMARY_BUTTON}>
          {isPending ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
    </form>
  );
}
