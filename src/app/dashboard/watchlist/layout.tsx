import { requirePageAccess } from '@/lib/page-guard';

export default async function WatchlistLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess('watchlist');
  return <>{children}</>;
}
