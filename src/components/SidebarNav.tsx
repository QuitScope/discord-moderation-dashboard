'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PageKey, ResolvedPermissions } from '@/lib/permission-constants';

type NavItem = { href: string; label: string; pageKey?: PageKey };
type NavSection = { label: string; items: NavItem[]; adminOnly?: boolean };

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const BarChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const sections: NavSection[] = [
  {
    label: 'Analytics',
    items: [
      { href: '/dashboard/analytics',   label: 'Analytics',   pageKey: 'analytics'  },
      { href: '/dashboard/leaderboard', label: 'Leaderboard', pageKey: 'leaderboard' },
      { href: '/dashboard/moderators',  label: 'Moderatoren', pageKey: 'moderators' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { href: '/dashboard/channels',   label: 'Kanäle',   pageKey: 'channels'   },
      { href: '/dashboard/roles',      label: 'Rollen',   pageKey: 'roles'      },
      { href: '/dashboard/cases',      label: 'Cases',    pageKey: 'cases'      },
      { href: '/dashboard/violations', label: 'Verstöße', pageKey: 'violations' },
      { href: '/dashboard/watchlist',  label: 'Watchlist', pageKey: 'watchlist' },
      { href: '/dashboard/audit',      label: 'Audit Log', pageKey: 'audit'     },
      { href: '/dashboard/automod',    label: 'AutoMod',   pageKey: 'automod'   },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/dashboard/members',        label: 'Members',        pageKey: 'members'         },
      { href: '/dashboard/birthdays',      label: 'Geburtstage',    pageKey: 'birthdays'       },
      { href: '/dashboard/reaction-roles', label: 'Reaktionsrollen', pageKey: 'reaction-roles' },
      { href: '/dashboard/embeds',         label: 'Embed Builder',  pageKey: 'embeds'          },
      { href: '/dashboard/threads',        label: 'Threads',        pageKey: 'threads'         },
      { href: '/dashboard/webhooks',       label: 'Webhooks',       pageKey: 'webhooks'        },
      { href: '/dashboard/confessions',    label: 'Confessions',    pageKey: 'confessions'     },
      { href: '/dashboard/welcome-card',   label: 'Welcome Card',   pageKey: 'welcome-card'    },
      { href: '/dashboard/ban-tags',       label: 'Ban-Tags',       pageKey: 'welcome-card'    },
      { href: '/dashboard/counting-fail-tiers', label: 'Counting Fail-Stufen', pageKey: 'counting-fail-tiers' },
      { href: '/dashboard/points', label: 'Punkte-System', pageKey: 'points' },
      { href: '/dashboard/wortkette-dictionary', label: 'Wortkette-Wörterbuch', pageKey: 'wortkette-dictionary' },
      { href: '/dashboard/wortkette-special-lines', label: 'Wortkette-Sprüche', pageKey: 'wortkette-special-lines' },
      { href: '/dashboard/wortkette', label: 'Wortkette-Admin', pageKey: 'wortkette-admin' },
      { href: '/dashboard/tempvoice', label: 'TempVoice', pageKey: 'tempvoice' },
    ],
  },
  {
    label: 'Einstellungen',
    items: [
      { href: '/dashboard/config',     label: 'Konfiguration', pageKey: 'config'     },
      { href: '/dashboard/templates',  label: 'Templates',     pageKey: 'templates'  },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { href: '/dashboard/admin/status',      label: 'System Status',    pageKey: 'admin-status'  },
      { href: '/dashboard/admin/config',      label: 'Admin Config',     pageKey: 'admin-config'  },
      { href: '/dashboard/admin/logging',     label: 'Logging',          pageKey: 'admin-logging' },
      { href: '/dashboard/admin/permissions', label: 'Rechteverwaltung'                           },
      { href: '/dashboard/admin/messages',    label: 'Massenlöschung'                             },
    ],
  },
];

const sectionIcons: Record<string, React.ReactNode> = {
  Analytics:    <BarChartIcon />,
  Moderation: <ShieldIcon />,
  Community: <UsersIcon />,
  Einstellungen: <SettingsIcon />,
  Admin: <LockIcon />,
};

interface SidebarNavProps {
  onNavigate?: () => void;
  isAdmin?: boolean;
  permissions?: ResolvedPermissions;
}

export function SidebarNav({ onNavigate, isAdmin, permissions }: SidebarNavProps) {
  const pathname = usePathname();
  const dashboardActive = pathname === '/dashboard';

  function canSee(item: NavItem): boolean {
    if (isAdmin) return true;
    if (!item.pageKey) return true;
    return permissions?.pages[item.pageKey]?.read ?? false;
  }

  return (
    <nav className="flex-1 px-2 py-2 overflow-y-auto">
      {/* Overview */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 mb-3"
        style={{
          color: dashboardActive ? 'var(--indigo-bright)' : 'var(--text-secondary)',
          background: dashboardActive ? 'var(--indigo-bg)' : 'transparent',
          borderLeft: dashboardActive ? '2px solid var(--indigo)' : '2px solid transparent',
        }}
      >
        <span style={{ color: dashboardActive ? 'var(--indigo-bright)' : 'var(--text-muted)', flexShrink: 0 }}>
          <GridIcon />
        </span>
        Übersicht
      </Link>

      {/* Sections */}
      {sections.map((section) => {
        if (section.adminOnly && !isAdmin) return null;
        const visibleItems = section.items.filter(canSee);
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.label} className="mb-4">
            {/* Section label */}
            <div
              className="flex items-center gap-2 px-3 mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span style={{ flexShrink: 0 }}>{sectionIcons[section.label]}</span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
              >
                {section.label}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                // Segment-boundary match — a plain startsWith() also lights up
                // '/dashboard/wortkette' for '/dashboard/wortkette-special-lines'.
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="flex items-center px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150"
                    style={{
                      paddingLeft: '2rem',
                      color: isActive ? 'var(--indigo-bright)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--indigo-bg)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--indigo)' : '2px solid transparent',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
