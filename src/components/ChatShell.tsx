'use client';

import { createContext, useContext, useState } from 'react';
import Sidebar from './Sidebar';
import { useConversations } from '@/hooks/useConversations';

type ChatShellProps = {
  userEmail: string;
  children: React.ReactNode;
};

type RefreshContextValue = () => Promise<void>;
const RefreshContext = createContext<RefreshContextValue | null>(null);

export function useRefreshConversations(): RefreshContextValue {
  const ctx = useContext(RefreshContext);
  return ctx || (async () => undefined);
}

export default function ChatShell({ userEmail, children }: ChatShellProps) {
  const { conversations, create, remove, refresh } = useConversations();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex bg-white text-gray-900 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          conversations={conversations}
          userEmail={userEmail}
          onCreate={create}
          onDelete={remove}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-gray-900/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-[280px] shadow-xl transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          conversations={conversations}
          userEmail={userEmail}
          onCreate={create}
          onDelete={remove}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="md:hidden border-b border-gray-200 bg-white px-3 py-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="사이드바 열기"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            {process.env.NEXT_PUBLIC_APP_NAME || 'AI Chat'}
          </span>
        </div>

        <RefreshContext.Provider value={refresh}>
          <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        </RefreshContext.Provider>
      </div>
    </div>
  );
}
