import { NextRequest } from 'next/server';
import {
  countMessages,
  findConversation,
  listMessages,
  saveMessage,
  touchConversation,
  updateConversationTitle,
} from '@/lib/db';
import { fail, getUserId } from '@/lib/api';
import { buildContents, streamGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return fail('인증이 필요합니다.', 401);

  let body: { conversationId?: number; content?: string };
  try {
    body = await req.json();
  } catch {
    return fail('잘못된 요청입니다.', 400);
  }

  const conversationId = Number(body.conversationId);
  const content = (body.content || '').trim();

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return fail('잘못된 대화 ID입니다.', 400);
  }
  if (!content) {
    return fail('메시지 내용이 비어 있습니다.', 400);
  }

  const conversation = findConversation(conversationId, userId);
  if (!conversation) {
    return fail('대화를 찾을 수 없습니다.', 404);
  }

  const isFirstMessage = countMessages(conversationId) === 0;
  saveMessage(conversationId, 'user', content);

  if (isFirstMessage) {
    const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
    updateConversationTitle(conversationId, title);
  }

  const history = listMessages(conversationId);
  const contents = buildContents(history);

  const encoder = new TextEncoder();
  const send = (writer: WritableStreamDefaultWriter<Uint8Array>, payload: object) =>
    writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  (async () => {
    let fullText = '';
    try {
      const result = await streamGemini(contents);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (!text) continue;
        fullText += text;
        await send(writer, { text });
      }
      saveMessage(conversationId, 'model', fullText);
      touchConversation(conversationId);
      await send(writer, { done: true });
      await writer.write(encoder.encode(`data: [DONE]\n\n`));
    } catch (err) {
      console.error('[chat.stream]', err);
      if (fullText) {
        saveMessage(conversationId, 'model', fullText);
        touchConversation(conversationId);
      }
      await send(writer, { error: 'AI 응답 생성 중 오류가 발생했습니다.' });
    } finally {
      await writer.close().catch(() => undefined);
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
