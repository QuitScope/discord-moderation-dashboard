import { fetchDiscordUser, getAvatarUrl, getDisplayName, getDefaultAvatarUrl } from '@/lib/discord';
import Image from 'next/image';
import Link from 'next/link';

interface UserDisplayProps {
  userId: string;
  showId?: boolean;
  linkable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export async function UserDisplay({ userId, showId = true, linkable = true, size = 'md' }: UserDisplayProps) {
  const user = await fetchDiscordUser(userId);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div className="flex items-center gap-2 group">
      <div className={`relative ${sizeClasses[size]} shrink-0`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-magenta-500 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
        <div className="relative rounded-full overflow-hidden border-2 border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
          <Image
            src={user ? getAvatarUrl(user, 128) || getDefaultAvatarUrl(userId) : getDefaultAvatarUrl(userId)}
            alt={user ? getDisplayName(user) : userId}
            width={48}
            height={48}
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        {user ? (
          <>
            <span className={`font-medium text-gray-100 group-hover:text-cyan-400 transition-colors truncate ${textSizeClasses[size]}`}>
              {getDisplayName(user)}
            </span>
            {showId && (
              <span className="text-xs font-mono text-gray-500 truncate">
                {userId.slice(0, 8)}...
              </span>
            )}
          </>
        ) : (
          <span className={`font-mono text-gray-400 truncate ${textSizeClasses[size]}`}>
            {userId}
          </span>
        )}
      </div>
    </div>
  );

  if (linkable) {
    return (
      <Link href={`/dashboard/users/${userId}`} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}

// Client component version for when we need client-side rendering
export function UserDisplaySkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className={`${sizeClasses[size]} rounded-full bg-gray-800`} />
      <div className="flex flex-col gap-1">
        <div className="h-4 w-24 bg-gray-800 rounded" />
        <div className="h-3 w-16 bg-gray-800 rounded" />
      </div>
    </div>
  );
}
