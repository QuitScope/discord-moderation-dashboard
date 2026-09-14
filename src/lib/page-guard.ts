import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import type { PageKey } from '@/lib/permission-constants';

export async function requirePageAccess(pageKey: PageKey) {
  const session = await auth();
  if (!session) redirect('/');
  if (!canRead(session, pageKey)) redirect('/dashboard');
}
