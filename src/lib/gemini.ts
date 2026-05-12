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

export async function streamGemini(contents: GeminiContent[]) {
  const model = getClient().getGenerativeModel({ model: MODEL_ID });
  return model.generateContentStream({ contents });
}
