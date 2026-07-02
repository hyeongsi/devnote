import type { AiPostGenerateRequest, AiPostGenerateResponse } from '../types';
import { fetchAdmin } from './adminAuth';

const AI_POSTS_API_URL = '/api/ai/posts';

export async function generateAiPost(
  request: AiPostGenerateRequest,
): Promise<AiPostGenerateResponse> {
  const response = await fetchAdmin(`${AI_POSTS_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI 글 초안을 생성하지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as AiPostGenerateResponse;
}
