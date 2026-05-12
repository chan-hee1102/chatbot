'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ConversationRow } from '@/lib/db';

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations', { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<ConversationRow[]>;
      if (json.success && json.data) {
        setConversations(json.data);
        setError(null);
      } else {
        setError(json.error || '대화 목록을 불러올 수 없습니다.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (): Promise<ConversationRow | null> => {
    try {
      const res = await fetch('/api/conversations', { method: 'POST' });
      const json = (await res.json()) as ApiResponse<ConversationRow>;
      if (json.success && json.data) {
        setConversations((prev) => [json.data!, ...prev]);
        return json.data;
      }
      setError(json.error || '대화 생성 실패');
      return null;
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      return null;
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ id: number }>;
      if (json.success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      } else {
        setError(json.error || '대화 삭제 실패');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    }
  }, []);

  return { conversations, loading, error, refresh, create, remove };
}
