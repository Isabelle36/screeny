'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { outlineButton } from '@/components/ui/button-styles';
import { openLoginModal } from '@/hooks/use-login-modal';
import { playSound } from '@/lib/sound';

export function AccountButton({ className = '' }: { className?: string }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <span aria-hidden="true" className={`${outlineButton()} invisible ${className}`}>Login</span>;
  }

  if (!isSignedIn) {
    return (
      <button type="button" onClick={openLoginModal} className={`${outlineButton()} ${className}`}>
        Login
      </button>
    );
  }

  return <AccountMenu email={user.primaryEmailAddress?.emailAddress ?? ''} imageUrl={user.imageUrl} className={className} />;
}

export function AccountMenuItems({ itemClassName, onNavigate }: { itemClassName: string; onNavigate: () => void }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate();
          openLoginModal();
        }}
        className={`${itemClassName} text-muted hover:text-foreground`}
      >
        Log in
      </button>
    );
  }

  return (
    <>
      <p className="mb-1 truncate text-body-sm text-muted">{user.primaryEmailAddress?.emailAddress}</p>
      <button
        type="button"
        onClick={() => {
          playSound('tap');
          onNavigate();
          signOut();
        }}
        className={`${itemClassName} text-muted hover:text-foreground`}
      >
        Log out
      </button>
    </>
  );
}

function AccountMenu({ email, imageUrl, className }: { email: string; imageUrl: string; className: string }) {
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="account-menu"
        aria-label="Account"
        className="grid size-10 cursor-pointer place-items-center rounded-full"
      >
        <img src={imageUrl} alt="" width={30} height={30} className="size-[30px] rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)]" />
      </button>
      {isOpen && (
        <div
          id="account-menu"
          className="account-menu absolute right-0 top-full z-40 mt-2 w-60 rounded-[16px] bg-background p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_-12px_rgba(0,0,0,0.25)]"
        >
          <p className="truncate px-3 pb-2 pt-2.5 text-body-sm text-muted">
            Signed in as
            <span className="block truncate text-body font-medium text-card-title">{email}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              setIsOpen(false);
              signOut();
            }}
            className="flex h-10 w-full cursor-pointer items-center rounded-[10px] px-3 text-left text-body font-medium text-foreground transition-colors duration-[120ms] hover:bg-surface"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
