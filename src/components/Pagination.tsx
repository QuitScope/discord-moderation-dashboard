'use client';

interface PaginationProps {
  page: number;
  /** Pass either totalPages directly (server-paginated) … */
  totalPages?: number;
  /** … or total + pageSize (client-side slicing); totalPages is derived. */
  total?: number;
  pageSize?: number;
  onPage: (page: number) => void;
  /** Provide together with pageSize to render the page-size selector. */
  onPageSize?: (size: number) => void;
  pageSizes?: number[];
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
  pageSizes = [25, 50, 100],
}: PaginationProps) {
  const pages = totalPages ?? Math.max(1, Math.ceil((total ?? 0) / (pageSize ?? 1)));

  // Nothing to page through and no size selector → render nothing.
  if (pages <= 1 && !onPageSize) return null;

  const list = buildPageList(page, pages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        {total != null
          ? `Seite ${page} von ${pages} · ${total} gesamt`
          : `Seite ${page} von ${pages}`}
      </span>

      <div className="flex items-center gap-2">
        {onPageSize && pageSize != null && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSize(Number(e.target.value));
              onPage(1);
            }}
            className="px-2 py-1 rounded text-xs"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s} / Seite
              </option>
            ))}
          </select>
        )}

        <PagBtn disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹
        </PagBtn>

        {list.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs" style={{ color: 'var(--text-dim)' }}>
              …
            </span>
          ) : (
            <PagBtn key={p} active={p === page} onClick={() => onPage(p as number)}>
              {p}
            </PagBtn>
          ),
        )}

        <PagBtn disabled={page >= pages} onClick={() => onPage(page + 1)}>
          ›
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({
  children,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-all"
      style={{
        background: active ? 'var(--indigo-bg)' : 'transparent',
        color: active ? 'var(--indigo-bright)' : disabled ? 'var(--text-dim)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'rgba(99,102,241,0.35)' : 'var(--border-default)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [];
  const add = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };

  add(1);
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) add(p);
  if (current < total - 2) pages.push('…');
  add(total);

  return pages;
}
