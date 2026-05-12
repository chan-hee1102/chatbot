'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useChat } from '@/hooks/useChat';

type ChatWindowProps = {
  conversationId: number;
  title: string;
  onAfterFirstMessage?: () => void;
};

export default function ChatWindow({ conversationId, title, onAfterFirstMessage }: ChatWindowProps) {
  const { messages, draft, streaming, error, loading, sendMessage, stop } = useChat(
    conversationId,
    onAfterFirstMessage
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, draft, streaming]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickToBottomRef.current = nearBottom;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center min-h-[3.25rem]">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 truncate">
          {title}
        </h2>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-6"
      >
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">불러오는 중...</p>
          ) : messages.length === 0 && !draft ? (
            <div className="text-center py-20">
              <p className="text-lg font-medium text-gray-900 mb-1">
                무엇을 도와드릴까요?
              </p>
              <p className="text-sm text-gray-500">아래에 메시지를 입력해 시작하세요.</p>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              {streaming && (
                <MessageBubble role="model" content={draft} streaming />
              )}
            </>
          )}
          {error && (
            <div className="my-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <MessageInput
        onSend={sendMessage}
        disabled={streaming}
        streaming={streaming}
        onStop={stop}
      />
    </div>
  );
}
