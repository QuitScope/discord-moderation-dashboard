import { auth } from '@/auth';
import { fetchGuildName } from '@/lib/discord';
import { WelcomeCardClient } from './WelcomeCardClient';

export default async function WelcomeCardPage() {
  const session = await auth();
  const previewUsername = session?.user?.name ?? 'Vorschau-User';
  const previewServerName = (await fetchGuildName()) ?? 'Server';

  return <WelcomeCardClient previewUsername={previewUsername} previewServerName={previewServerName} />;
}
