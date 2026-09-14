import { getTemplates } from '@/lib/api';
import TemplatesClient from './TemplatesClient';

export default async function TemplatesPage() {
  let templates: Awaited<ReturnType<typeof getTemplates>> | null = null;
  let error = '';

  try {
    templates = await getTemplates();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Fehler beim Laden der Templates.';
  }

  return (
    <div className="space-y-6 max-w-6xl animate-in">
      {/* Header */}
      <div>
        <h1 className="text-display text-2xl md:text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Embed Templates
        </h1>
        <div className="flex items-start md:items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          <svg className="shrink-0 mt-0.5 md:mt-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>Verwalte Embed-Vorlagen für Welcome Messages, Notifications und mehr</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <span style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Templates Client */}
      {templates && <TemplatesClient initialTemplates={templates} />}
    </div>
  );
}
