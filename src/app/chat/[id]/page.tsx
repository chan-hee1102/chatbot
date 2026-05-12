import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';
import { findConversation } from '@/lib/db';
import ChatWindowRefreshOnFirst from './ChatWindowRefreshOnFirst';

export default async function ChatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) redirect('/login');

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const conversation = findConversation(id, payload.userId);
  if (!conversation) notFound();

  return (
    <ChatWindowRefreshOnFirst
      conversationId={conversation.id}
      title={conversation.title}
    />
  );
}
