import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { loginAction } from './actions';

export default async function HomePage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'var(--amber-bg)',
            color: 'var(--amber)',
            border: '1px solid rgba(245,158,11,0.25)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--amber)', display: 'inline-block' }}
          />
          Moderations-Dashboard
        </div>

        {/* Heading */}
        <div>
          <h1
            className="text-display text-5xl mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            ModGuard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Moderations-Panel — Live-Demo mit Beispieldaten, kein echter Discord-Server nötig.
          </p>
        </div>

        {/* Login button */}
        <form action={loginAction}>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2.5 px-6 py-3 text-sm"
            style={{ borderRadius: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Demo-Login starten
          </button>
        </form>
      </div>
    </main>
  );
}
