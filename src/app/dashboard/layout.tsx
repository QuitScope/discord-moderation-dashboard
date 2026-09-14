export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/DashboardShell';
import { NoAccess } from '@/components/NoAccess';
import { hasAnyAccess } from '@/lib/permissions';
import type { DashboardSession } from '@/lib/permissions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/');

  const s = session as DashboardSession;

  if (!hasAnyAccess(session)) {
    return <NoAccess />;
  }

  return (
    <DashboardShell session={session} isAdmin={s.isGuildAdmin ?? false} permissions={s.permissions}>
      {children}
    </DashboardShell>
  );
}
