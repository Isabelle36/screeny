type IdentityUser = {
  primaryEmailAddress?: { emailAddress: string } | null;
  externalAccounts: { provider: string; username?: string }[];
};

export function xHandleOf(user: IdentityUser) {
  const username = user.externalAccounts.find((account) => account.provider === 'x')?.username;
  return username ? `@${username}` : null;
}

export function accountIdentityOf(user: IdentityUser) {
  return user.primaryEmailAddress?.emailAddress ?? xHandleOf(user) ?? '';
}
