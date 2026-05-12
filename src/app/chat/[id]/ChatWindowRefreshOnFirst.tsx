'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import { useRefreshConversations } from '@/components/ChatShell';

type Props = {
  conversationId: number;
  title: string;
};

export default function ChatWindowRefreshOnFirst({ conversationId, title }: Props) {
  const router = useRouter();
  const refresh = useRefreshConversations();

  const onAfterFirstMessage = useCallback(() => {
    void refresh();
    router.refresh();
  }, [refresh, router]);

  return (
    <ChatWindow
      conversationId={conversationId}
      title={title}
      onAfterFirstMessage={onAfterFirstMessage}
    />
  );
}
