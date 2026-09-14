import { auth } from '@/auth';
import { type DashboardSession } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (!(session as DashboardSession).isGuildAdmin) return new Response('Forbidden', { status: 403 });
  return new Response('Not available in this demo yet', { status: 501 });
}
