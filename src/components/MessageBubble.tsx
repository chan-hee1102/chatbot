'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ComponentPropsWithoutRef } from 'react';

export type Role = 'user' | 'model';

type MessageBubbleProps = {
  role: Role;
  content: string;
  streaming?: boolean;
};

export default function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`${
          isUser
            ? 'bg-gray-900 text-white max-w-[85%] sm:max-w-[70%]'
            : 'bg-white text-gray-900 max-w-[90%] sm:max-w-[80%] border border-gray-200'
        } rounded-2xl px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
            {content}
          </p>
        ) : (
          <div className="markdown-body text-[15px] leading-relaxed break-words text-gray-900">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props: ComponentPropsWithoutRef<'code'>) {
                  const { className, children, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const text = String(children ?? '').replace(/\n$/, '');
                  if (match) {
                    return (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={oneLight}
                        PreTag="div"
                        customStyle={{
                          margin: '0.5rem 0',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        {text}
                      </SyntaxHighlighter>
                    );
                  }
                  return (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {streaming && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 align-[-2px] animate-pulse rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
