import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifyToken } from './lib/auth';

export const config = {
  matcher: [
    '/chat/:path*',
    '/api/conversations/:path*',
    '/api/messages/:path*',
    '/api/chat/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  const isApi = req.nextUrl.pathname.startsWith('/api/');

  if (!payload) {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', String(payload.userId));
  requestHeaders.set('x-user-email', payload.email);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
