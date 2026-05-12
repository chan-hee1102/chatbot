import { NextRequest } from 'next/server';
import { findConversation, listMessages } from '@/lib/db';
import { fail, getUserId, ok } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  if (!userId) return fail('인증이 필요합니다.', 401);

  const conversationId = Number(params.id);
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return fail('잘못된 대화 ID입니다.', 400);
  }

  try {
    const conv = findConversation(conversationId, userId);
    if (!conv) return fail('대화를 찾을 수 없습니다.', 404);
    const messages = listMessages(conversationId);
    return ok({ conversation: conv, messages });
  } catch (err) {
    console.error('[messages.GET]', err);
    return fail('메시지를 불러올 수 없습니다.', 500);
  }
}
