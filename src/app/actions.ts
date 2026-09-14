'use server';

import { signIn, signOut } from '@/auth';

export async function loginAction() {
  await signIn('credentials', { redirectTo: '/dashboard' });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' });
}

export async function inlineLogoutAction() {
  'use server';
  await signOut({ redirectTo: '/' });
}
