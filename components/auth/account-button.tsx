'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { AccountMenu } from '@/components/layout/account-menu';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { outlineButton } from '@/components/ui/button-styles';
import { openLoginModal } from '@/hooks/use-login-modal';
import type { BrowseTab } from '@/lib/browse';

type AccountButtonProps = {
  activeTab: BrowseTab;
  onSelectTab: (tab: BrowseTab) => void;
};

export function AccountButton({ activeTab, onSelectTab }: AccountButtonProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

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
      email={user.primaryEmailAddress?.emailAddress ?? ''}
      imageUrl={user.imageUrl}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      onSignOut={() => signOut()}
    />
  );
}
