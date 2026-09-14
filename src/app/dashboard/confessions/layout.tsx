import { requirePageAccess } from '@/lib/page-guard';

export default async function ConfessionsLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess('confessions');
  return <>{children}</>;
}
