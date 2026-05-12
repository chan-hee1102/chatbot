import { NextRequest } from 'next/server';
import { createConversation, listConversations } from '@/lib/db';
import { fail, getUserId, ok } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return fail('인증이 필요합니다.', 401);
  try {
    const rows = listConversations(userId);
    return ok(rows);
  } catch (err) {
    console.error('[conversations.GET]', err);
    return fail('대화 목록을 불러올 수 없습니다.', 500);
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return fail('인증이 필요합니다.', 401);
  try {
    const conv = createConversation(userId);
    return ok(conv, 201);
  } catch (err) {
    console.error('[conversations.POST]', err);
    return fail('대화를 생성할 수 없습니다.', 500);
  }
}
