import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/db';
import { fail, ok } from '@/lib/api';
import { AUTH_COOKIE, cookieOptions, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return fail('잘못된 요청입니다.', 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !password) {
    return fail('이메일과 비밀번호를 입력하세요.', 400);
  }

  try {
    const user = findUserByEmail(email);
    if (!user) {
      return fail('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }
    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) {
      return fail('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    const token = await signToken({ userId: user.id, email: user.email });
    const res: NextResponse = ok({ id: user.id, email: user.email });
    res.cookies.set(AUTH_COOKIE, token, cookieOptions);
    return res;
  } catch (err) {
    console.error('[login]', err);
    return fail('로그인 처리 중 오류가 발생했습니다.', 500);
  }
}
