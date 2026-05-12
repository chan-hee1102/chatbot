'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MessageRow } from '@/lib/db';

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

type MessagesPayload = {
  conversation: { id: number; title: string };
  messages: MessageRow[];
};

type ClientMessage = {
  id: number | string;
  role: 'user' | 'model';
  content: string;
};

let tempIdSeq = 1;
const tempId = () => `temp-${tempIdSeq++}`;

export function useChat(conversationId: number, onAfterFirstMessage?: () => void) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wasFirstRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDraft('');
    setStreaming(false);
    abortRef.current?.abort();
    abortRef.current = null;

    (async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          cache: 'no-store',
        });
        const json = (await res.json()) as ApiResponse<MessagesPayload>;
        if (cancelled) return;
        if (json.success && json.data) {
          setMessages(json.data.messages);
        } else {
          setError(json.error || '메시지를 불러올 수 없습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류가 발생했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [conversationId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || streaming) return;

      const userMsg: ClientMessage = { id: tempId(), role: 'user', content: trimmed };
      wasFirstRef.current = messages.length === 0;
      setMessages((prev) => [...prev, userMsg]);
      setDraft('');
      setError(null);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, content: trimmed }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const evt of events) {
            const line = evt.split('\n').find((l) => l.startsWith('data:'));
            if (!line) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const obj = JSON.parse(data) as {
                text?: string;
                done?: boolean;
                error?: string;
              };
              if (obj.error) {
                throw new Error(obj.error);
              }
              if (obj.text) {
                accumulated += obj.text;
                setDraft(accumulated);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message) {
                throw parseErr;
              }
            }
          }
        }

        if (accumulated) {
          setMessages((prev) => [
            ...prev,
            { id: tempId(), role: 'model', content: accumulated },
          ]);
        }
        setDraft('');

        if (wasFirstRef.current && onAfterFirstMessage) {
          onAfterFirstMessage();
        }
      } catch (err) {
        if (controller.signal.aborted) {
          if (accumulated) {
            setMessages((prev) => [
              ...prev,
              { id: tempId(), role: 'model', content: accumulated + '\n\n_(중단됨)_' },
            ]);
          }
          setDraft('');
        } else {
          console.error('[useChat]', err);
          setError(err instanceof Error ? err.message : '응답 처리 중 오류가 발생했습니다.');
          setDraft('');
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [conversationId, messages.length, streaming, onAfterFirstMessage]
  );

  return { messages, draft, streaming, loading, error, sendMessage, stop };
}
