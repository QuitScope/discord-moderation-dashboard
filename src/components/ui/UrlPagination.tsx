'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/Pagination';

// URL-driven pagination for server components: writes the page into a query
// param (default `page`) so the server page re-fetches. Multiple instances
// with different `param`s can coexist on one page (e.g. audit's cp/ep).

export function UrlPagination({
  page,
  pages,
  total,
  param = 'page',
}: {
  page: number;
  pages: number;
  total?: number;
  param?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, String(p));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return <Pagination page={page} totalPages={pages} total={total} onPage={goToPage} />;
}
