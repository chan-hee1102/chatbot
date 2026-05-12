import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MessageRow } from './db';

const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const CONTEXT_WINDOW = 20;

export type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

let clientInstance: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (clientInstance) return clientInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  clientInstance = new GoogleGenerativeAI(apiKey);
  return clientInstance;
}

export function buildContents(messages: MessageRow[]): GeminiContent[] {
  const recent = messages.slice(-CONTEXT_WINDOW);
  return recent.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
}

function buildSystemInstruction(): string {
  const now = new Date();
  const today = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);

  return [
    `현재 시각: ${today} (Asia/Seoul)`,
    '당신은 친절하고 정확한 한국어 AI 어시스턴트입니다.',
    '사용자 질문에 간결하고 명확하게 답하며, 필요할 때 마크다운(코드 블록, 표, 목록)을 활용하세요.',
    '확실하지 않은 정보는 추측하지 말고 모른다고 답하세요.',
  ].join('\n');
}

export async function streamGemini(contents: GeminiContent[]) {
  const model = getClient().getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: buildSystemInstruction(),
  });
  return model.generateContentStream({ contents });
}
