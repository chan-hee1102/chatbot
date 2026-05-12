'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import type { ConversationRow } from '@/lib/db';

type SidebarProps = {
  conversations: ConversationRow[];
  userEmail: string;
  onCreate: () => Promise<ConversationRow | null>;
  onDelete: (id: number) => Promise<void>;
  onClose?: () => void;
};

export default function Sidebar({ conversations, userEmail, onCreate, onDelete, onClose }: SidebarProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id ? Number(params.id) : null;
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const conv = await onCreate();
      if (conv) {
        router.push(`/chat/${conv.id}`);
        onClose?.();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    const ok = window.confirm('이 대화를 삭제하시겠습니까?');
    if (!ok) return;
    await onDelete(id);
    if (activeId === id) {
      router.push('/chat');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'AI Chat';

  return (
    <aside className="h-full w-full sm:w-[260px] shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="text-sm font-semibold tracking-tight text-gray-900 mb-3">
          {appName}
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>새 대화</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-xs text-gray-500 text-center">
            대화가 없습니다.
          </p>
        ) : (
          conversations.map((c) => {
            const isActive = activeId === c.id;
            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                onClick={onClose}
                className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <span className="truncate flex-1">{c.title}</span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, c.id)}
                  aria-label="대화 삭제"
                  className={`shrink-0 text-gray-400 hover:text-red-600 transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </Link>
            );
          })
        )}
      </nav>

      <div className="border-t border-gray-200 p-3 space-y-1 text-sm">
        <div className="px-2 py-1 text-xs text-gray-500 truncate" title={userEmail}>
          {userEmail}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left px-2 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
