import { NextResponse } from 'next/server';
import { ok } from '@/lib/api';
import { AUTH_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const res: NextResponse = ok({ loggedOut: true });
  res.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
