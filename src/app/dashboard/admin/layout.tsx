import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { DashboardSession } from '@/lib/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/');
  if (!(session as DashboardSession).isGuildAdmin) redirect('/dashboard');
  return <>{children}</>;
}
