import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';
import ChatShell from '@/components/ChatShell';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    redirect('/login');
  }

  return <ChatShell userEmail={payload.email}>{children}</ChatShell>;
}
