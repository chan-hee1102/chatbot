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
    <div className="border-t border-gray-800 bg-gray-950 px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={disabled ? 'AI 응답 생성 중...' : '메시지를 입력하세요 (Shift+Enter 줄바꿈)'}
          disabled={disabled}
          className="flex-1 px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
        />
        {streaming && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            aria-label="응답 중단"
          >
            중단
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="shrink-0 h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        )}
      </div>
    </div>
  );
}
