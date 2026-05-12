'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`${
          isUser
            ? 'bg-blue-600 text-white max-w-[85%] sm:max-w-[70%]'
            : 'bg-gray-800 text-gray-100 max-w-[90%] sm:max-w-[80%]'
        } rounded-2xl px-4 py-3 shadow-sm`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        ) : (
          <div className="markdown-body text-[15px] leading-relaxed break-words">
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
                        style={oneDark}
                        PreTag="div"
                        customStyle={{ margin: '0.5rem 0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
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
              <span className="inline-block w-2 h-4 bg-gray-300 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
