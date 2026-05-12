import { NextRequest, NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

export function getUserId(req: NextRequest): number | null {
  const raw = req.headers.get('x-user-id');
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}
