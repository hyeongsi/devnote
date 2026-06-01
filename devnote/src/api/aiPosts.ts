import type { AiPostGenerateRequest, AiPostGenerateResponse } from '../types';

const AI_POSTS_API_URL = 'http://localhost:8080/api/ai/posts';

export async function generateAiPost(
  request: AiPostGenerateRequest,
): Promise<AiPostGenerateResponse> {
  const response = await fetch(`${AI_POSTS_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('FORBIDDEN');
  }

  if (!response.ok) {
    throw new Error(`AI 글 초안을 생성하지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as AiPostGenerateResponse;
}
