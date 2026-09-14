import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { requirePageAccess } from '@/lib/page-guard';
import { WriteAccessProvider } from './WriteAccess';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePageAccess('tempvoice');
  const session = await auth();
  return <WriteAccessProvider canWrite={canWrite(session, 'tempvoice')}>{children}</WriteAccessProvider>;
}
