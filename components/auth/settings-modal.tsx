'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/app/action-icons';
import { FIELD_SURFACE } from '@/components/ui/field-styles';
import { useSoundEnabled } from '@/hooks/use-sound-enabled';
import { playSound } from '@/lib/sound';

type SettingsModalProps = { isOpen: boolean; onClose: () => void };
type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;
type Status = 'idle' | 'saving' | 'error';
type View = 'settings' | 'delete';
type DeleteStatus = 'idle' | 'deleting' | 'error';

const NAME_MAX_LENGTH = 64;
const VIEW_TITLE_IDS: Record<View, string> = { settings: 'settings-title', delete: 'delete-account-title' };

const DIALOG =
  'settings-modal m-auto max-h-[calc(100dvh-2rem)] w-[min(384px,calc(100vw-2rem))] overflow-y-auto rounded-[12px] bg-background p-0 text-black-600 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_24px_64px_-16px_rgba(0,0,0,0.28)] backdrop:bg-black/30';
const HEADER = 'relative pl-5 pr-14 pt-5';
const TITLE = 'text-[1.0625rem] font-medium tracking-[-0.02em] text-black-700';
const CLOSE =
  'absolute right-3.5 top-3.5 grid size-8 cursor-pointer place-items-center rounded-full text-muted transition-colors duration-[120ms] hover:bg-black/4 hover:text-black-600 disabled:cursor-default disabled:opacity-60';
const ROW = 'flex min-h-12 items-center justify-between gap-4 border-t border-white-200 px-5 py-2';
const LABEL = 'text-body-sm font-medium text-black-600';
const VALUE = 'min-w-0 truncate text-body-sm text-muted';
const ERROR = 'mt-1.5 text-body-sm text-[#b42318]';
const PILL =
  'inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full bg-background px-3 text-body-sm font-medium text-black-600 shadow-[0_0_0_1px_var(--white-200),0_1px_2px_rgba(0,0,0,0.05)] transition-[background-color,scale] duration-150 ease-out hover:bg-white-50 active:scale-[0.97] disabled:cursor-default disabled:opacity-50 disabled:active:scale-100';
const QUIET =
  'inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full px-2.5 text-body-sm font-medium text-muted transition-colors duration-[120ms] hover:bg-black/4 hover:text-black-600 disabled:cursor-default disabled:opacity-60';
const PANEL_BODY = 'border-y border-white-200 bg-white-50';
const PANEL_FOOTER = 'flex items-center justify-between px-5 py-3.5';
const CANCEL =
  'inline-flex h-8 cursor-pointer items-center rounded-full bg-white-100 px-3.5 text-body-sm font-medium text-muted transition-colors duration-[120ms] hover:bg-white-200 hover:text-black-600 disabled:cursor-default disabled:opacity-60';
const CONFIRM =
  'inline-flex h-8 cursor-pointer items-center rounded-full px-4 text-body-sm font-medium text-white transition-[background-color,opacity,scale] duration-150 ease-out active:scale-[0.97] disabled:cursor-default disabled:active:scale-100';

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

function useModalDialog(isOpen: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  return dialogRef;
}

function useDeleteAccount() {
  const { signOut } = useClerk();
  const [status, setStatus] = useState<DeleteStatus>('idle');

  const run = async () => {
    setStatus('deleting');
    const response = await fetch('/api/account', { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      setStatus('error');
      return;
    }
    await signOut({ redirectUrl: '/' }).catch(() => window.location.reload());
  };

  return { status, run, reset: () => setStatus('idle') };
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const dialogRef = useModalDialog(isOpen);
  const { user } = useUser();
  const [view, setView] = useState<View>('settings');
  const [returnedFrom, setReturnedFrom] = useState<View | null>(null);
  const deletion = useDeleteAccount();

  const backToSettings = () => {
    if (deletion.status === 'deleting') return;
    deletion.reset();
    setReturnedFrom(view);
    setView('settings');
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={VIEW_TITLE_IDS[view]}
      aria-describedby={view === 'delete' ? 'delete-account-description' : undefined}
      onCancel={(event) => {
        if (view === 'settings') return;
        event.preventDefault();
        backToSettings();
      }}
      onClose={() => {
        if (isOpen) playSound('modal-close');
        setView('settings');
        setReturnedFrom(null);
        deletion.reset();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (view === 'settings') dialogRef.current?.close();
        else backToSettings();
      }}
      className={DIALOG}
    >
      {isOpen && user && view === 'settings' && (
        <SettingsPanel user={user} returnedFrom={returnedFrom} onDone={() => dialogRef.current?.close()} onOpenView={setView} />
      )}
      {isOpen && view === 'delete' && <DeleteAccountPanel status={deletion.status} onConfirm={deletion.run} onCancel={backToSettings} />}
    </dialog>
  );
}

type SettingsPanelProps = { user: ClerkUser; returnedFrom: View | null; onDone: () => void; onOpenView: (view: View) => void };

function SettingsPanel({ user, returnedFrom, onDone, onOpenView }: SettingsPanelProps) {
  return (
    <div className={returnedFrom ? 'settings-view' : undefined}>
      <div className={HEADER}>
        <h2 id="settings-title" className={TITLE}>
          Settings
        </h2>
        <button type="button" onClick={onDone} aria-label="Close settings" className={CLOSE}>
          <CloseIcon size={16} />
        </button>
        <h3 className="relative -mb-px mt-4 inline-block border-b-[1.5px] border-black-600 pb-2.5 text-body-sm font-medium text-black-300">
          General
        </h3>
      </div>

      <div className="bg-white-50">
        <AvatarRow user={user} />
        <NameRow user={user} />
        <div className={ROW}>
          <span className={LABEL}>Email</span>
          <span className={VALUE}>{user.primaryEmailAddress?.emailAddress}</span>
        </div>
        <SoundRow />
        <div className={ROW}>
          <span className="text-body-sm font-medium text-[#912018]">Danger</span>
          <button
            type="button"
            autoFocus={returnedFrom === 'delete'}
            onClick={() => onOpenView('delete')}
            className="inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full bg-[#fee4e2] px-3 text-body-sm font-medium text-[#b42318] transition-[background-color,scale] duration-150 ease-out hover:bg-[#fdd5d1] active:scale-[0.97]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarRow({ user }: { user: ClerkUser }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  const upload = async (file: File) => {
    setStatus('saving');
    try {
      await user.setProfileImage({ file });
      setStatus('idle');
      playSound('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={ROW}>
      <div className="min-w-0">
        <span className={LABEL}>Avatar</span>
        {status === 'error' && <p className={ERROR}>Couldn’t upload that image. Try a JPG or PNG under 10 MB.</p>}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'saving'}
        aria-label="Change avatar"
        title="Change avatar"
        className="group shrink-0 cursor-pointer rounded-full disabled:cursor-progress"
      >
        <img
          src={user.imageUrl}
          alt=""
          width={30}
          height={30}
          className={`size-[30px] rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)] transition-opacity duration-150 ${
            status === 'saving' ? 'opacity-50' : 'group-hover:opacity-80'
          }`}
        />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) upload(file);
        }}
      />
    </div>
  );
}

function SoundRow() {
  const [isSoundOn, setSoundOn] = useSoundEnabled();
  return (
    <label className={`${ROW} cursor-pointer`}>
      <span className="min-w-0">
        <span className={`block ${LABEL}`}>Sounds</span>
        <span className="block text-body-sm text-muted">Play quiet sounds when you click and save.</span>
      </span>
      <input
        type="checkbox"
        checked={isSoundOn}
        onChange={(event) => {
          setSoundOn(event.target.checked);
          if (event.target.checked) playSound('toggle-on');
        }}
        className="size-[18px] shrink-0 cursor-pointer accent-black-600"
      />
    </label>
  );
}

function NameRow({ user }: { user: ClerkUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRefocusEdit = useRef(false);
  const name = draft.trim();
  const isSaving = status === 'saving';
  const canSave = name.length > 0 && name !== (user.fullName ?? '') && !isSaving;

  useEffect(() => {
    if (isEditing || !shouldRefocusEdit.current) return;
    shouldRefocusEdit.current = false;
    editButtonRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
    setDraft(user.fullName ?? '');
    setStatus('idle');
    setIsEditing(true);
  };

  const stopEditing = () => {
    shouldRefocusEdit.current = true;
    setIsEditing(false);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const [firstName, ...rest] = name.split(/\s+/);
    setStatus('saving');
    try {
      await user.update({ firstName, lastName: rest.join(' ') });
      playSound('success');
      setStatus('idle');
      stopEditing();
    } catch {
      setStatus('error');
    }
  };

  if (!isEditing) {
    return (
      <div className={ROW}>
        <span className={LABEL}>Name</span>
        <div className="flex min-w-0 items-center gap-3">
          <span className={VALUE}>{user.fullName || 'Not set'}</span>
          <button ref={editButtonRef} type="button" onClick={startEditing} className={PILL}>
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className={`${ROW} flex-wrap`}>
      <label htmlFor="settings-name" className={LABEL}>
        Name
      </label>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <input
          id="settings-name"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (status === 'error') setStatus('idle');
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            stopEditing();
          }}
          maxLength={NAME_MAX_LENGTH}
          required
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          autoFocus={!isTouchDevice()}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={status === 'error' ? 'settings-name-error' : undefined}
          className={`h-8 min-w-0 max-w-48 flex-1 rounded-[8px] px-2.5 ${FIELD_SURFACE}`}
        />
        <button type="button" onClick={stopEditing} disabled={isSaving} className={QUIET}>
          Cancel
        </button>
        <button type="submit" disabled={!canSave} className={PILL}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {status === 'error' && (
        <p id="settings-name-error" role="alert" className={`${ERROR} w-full text-right`}>
          Couldn’t save your name. Try again.
        </p>
      )}
    </form>
  );
}

type DeleteAccountPanelProps = { status: DeleteStatus; onConfirm: () => void; onCancel: () => void };

function DeleteAccountPanel({ status, onConfirm, onCancel }: DeleteAccountPanelProps) {
  const isDeleting = status === 'deleting';

  return (
    <div className="settings-view">
      <div className={`${HEADER} pb-4`}>
        <h2 id="delete-account-title" className={TITLE}>
          Delete account?
        </h2>
        <button type="button" onClick={onCancel} disabled={isDeleting} aria-label="Back to settings" className={CLOSE}>
          <CloseIcon size={16} />
        </button>
      </div>

      <div className={`${PANEL_BODY} px-8 py-6 text-center`}>
        <p id="delete-account-description" className="text-pretty text-body-sm text-muted">
          Your account and all your bookmarks will be permanently removed. This can’t be undone.
        </p>
        {status === 'error' && (
          <p role="alert" className={ERROR}>
            Couldn’t delete your account. Try again.
          </p>
        )}
      </div>

      <div className={PANEL_FOOTER}>
        <button type="button" autoFocus onClick={onCancel} disabled={isDeleting} className={CANCEL}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={isDeleting} className={`${CONFIRM} bg-danger hover:bg-danger-hover disabled:opacity-70`}>
          {isDeleting ? 'Deleting…' : 'Delete account'}
        </button>
      </div>
    </div>
  );
}
