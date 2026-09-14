// Single source of truth for case-status badges.
// Previously duplicated in cases/CasesClient and audit/page with diverging
// label maps (audit was missing `dry_run`). Pure component — safe in both
// server and client components.

const STATUS: Record<string, { cls: string; label: string }> = {
  final: { cls: 'badge badge-success', label: 'Abgeschlossen' },
  revoked: { cls: 'badge badge-neutral', label: 'Widerrufen' },
  expired: { cls: 'badge badge-neutral', label: 'Abgelaufen' },
  draft: { cls: 'badge badge-warning', label: 'Entwurf' },
  pending: { cls: 'badge badge-info', label: 'Ausstehend' },
  dry_run: { cls: 'badge badge-orange', label: '[DRY RUN]' },
};

export function CaseStatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { cls: 'badge badge-neutral', label: status };
  return <span className={cfg.cls}>{cfg.label}</span>;
}
