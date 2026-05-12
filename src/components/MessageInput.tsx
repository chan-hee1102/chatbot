'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';

type MessageInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
  onStop?: () => void;
  streaming?: boolean;
};

export default function MessageInput({ onSend, disabled, onStop, streaming }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10 transition px-3 py-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={disabled ? 'AI 응답 생성 중...' : '메시지를 입력하세요'}
            disabled={disabled}
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed py-1.5 text-[15px]"
          />
          {streaming && onStop ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="응답 중단"
              className="btn-pop shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900 hover:bg-gray-800 text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={disabled || !value.trim()}
              aria-label="메시지 전송"
              className="btn-pop shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 text-center">
          Enter 전송 · Shift + Enter 줄바꿈
        </p>
      </div>
    </div>
  );
}
