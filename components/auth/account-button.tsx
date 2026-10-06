'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { accountIdentityOf } from '@/components/auth/account-identity';
import { AccountMenu } from '@/components/layout/account-menu';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { outlineButton } from '@/components/ui/button-styles';
import { openLoginModal } from '@/hooks/use-login-modal';
import { useIsCompletingSso } from '@/hooks/use-sso-callback';
import type { BrowseTab } from '@/lib/browse';

type AccountButtonProps = {
  activeTab: BrowseTab;
  onSelectTab: (tab: BrowseTab) => void;
};

export function AccountButton({ activeTab, onSelectTab }: AccountButtonProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isCompletingSignIn = useIsCompletingSso();

  if (isCompletingSignIn && !isSignedIn) {
    return (
      <span className="grid size-10 place-items-center">
        <span aria-hidden="true" className="skeleton block size-[30px] rounded-full" />
        <span role="status" className="sr-only">
          Signing in…
        </span>
      </span>
    );
  }

  if (!isLoaded) {
    return <span aria-hidden="true" className="size-10" />;
  }

  if (!isSignedIn) {
    return (
      <>
        <button type="button" onClick={openLoginModal} className={`${outlineButton()} ml-1.5 max-md:hidden`}>
          Login
        </button>
        <MobileMenu activeTab={activeTab} onSelectTab={onSelectTab} />
      </>
    );
  }

  return (
    <AccountMenu
      name={user.fullName}
      identity={accountIdentityOf(user)}
      imageUrl={user.imageUrl}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      onSignOut={() => signOut()}
    />
  );
}
