'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mode = 'login' | 'register';

type AuthFormProps = {
  mode: Mode;
};

const COPY: Record<Mode, { title: string; submit: string; switchHref: string; switchText: string }> = {
  login: {
    title: '로그인',
    submit: '로그인',
    switchHref: '/register',
    switchText: '계정이 없으신가요? 회원가입',
  },
  register: {
    title: '회원가입',
    submit: '계정 만들기',
    switchHref: '/login',
    switchText: '이미 계정이 있으신가요? 로그인',
  },
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copy = COPY[mode];
  const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 모두 입력하세요.');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data?.error || '요청을 처리할 수 없습니다.');
        return;
      }

      if (mode === 'login') {
        router.push('/chat');
        router.refresh();
      } else {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (loginRes.ok) {
          router.push('/chat');
          router.refresh();
        } else {
          router.push('/login');
        }
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-gray-900 text-center mb-6">
        {copy.title}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50 transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50 transition"
            placeholder={mode === 'register' ? '8자 이상' : ''}
          />
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-lift w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '처리 중...' : copy.submit}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href={copy.switchHref}
          className="text-sm text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors"
        >
          {copy.switchText}
        </Link>
      </div>
    </div>
  );
}
