'use client';

import { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/SidebarNav';
import { ToastProvider } from '@/components/ToastProvider';
import { logoutAction } from '@/app/actions';
import type { ResolvedPermissions } from '@/lib/permission-constants';

interface DashboardShellProps {
  session: {
    user?: {
      name?: string | null;
    };
  };
  isAdmin: boolean;
  permissions?: ResolvedPermissions;
  children: React.ReactNode;
}

export function DashboardShell({ session, isAdmin, permissions, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 lg:hidden"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hamburger-btn p-2"
          aria-label="Menu öffnen"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--indigo)' }}
          >
            <span className="text-[11px] font-black" style={{ color: '#fff' }}>MG</span>
          </div>
          <div>
            <div className="text-display text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
              ModGuard
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {session.user?.name ?? 'Moderator'}
            </div>
          </div>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="drawer-overlay fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300
          lg:relative lg:w-56 lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--indigo)' }}
            >
              <span className="text-[11px] font-black" style={{ color: '#fff' }}>MG</span>
            </div>
            <div>
              <div className="text-display text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                ModGuard
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Moderation
              </div>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/5 rounded transition-colors"
            aria-label="Menu schließen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <SidebarNav onNavigate={() => setIsSidebarOpen(false)} isAdmin={isAdmin} permissions={permissions} />

        {/* User footer */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 px-2 mb-2.5">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--emerald)' }}
            />
            <span
              className="text-xs truncate"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              {session.user?.name ?? 'Moderator'}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="signout-link flex items-center justify-center w-full px-3 py-1.5 rounded text-xs transition-colors"
              style={{
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
        <ToastProvider />
      </main>
    </div>
  );
}
