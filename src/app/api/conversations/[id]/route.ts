import { NextRequest } from 'next/server';
import { deleteConversation } from '@/lib/db';
import { fail, getUserId, ok } from '@/lib/api';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  if (!userId) return fail('인증이 필요합니다.', 401);

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return fail('잘못된 대화 ID입니다.', 400);
  }

  try {
    const deleted = deleteConversation(id, userId);
    if (!deleted) return fail('대화를 찾을 수 없습니다.', 404);
    return ok({ id });
  } catch (err) {
    console.error('[conversations.DELETE]', err);
    return fail('대화 삭제 중 오류가 발생했습니다.', 500);
  }
}
