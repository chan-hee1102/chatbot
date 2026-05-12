import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '@/lib/db';
import { fail, ok } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!EMAIL_RE.test(email)) {
    return fail('올바른 이메일 형식이 아닙니다.', 400);
  }
  if (password.length < 8) {
    return fail('비밀번호는 8자 이상이어야 합니다.', 400);
  }

  try {
    if (findUserByEmail(email)) {
      return fail('이미 가입된 이메일입니다.', 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = createUser(email, passwordHash);
    return ok({ id: user.id, email: user.email }, 201);
  } catch (err) {
    console.error('[register]', err);
    return fail('회원가입 처리 중 오류가 발생했습니다.', 500);
  }
}
