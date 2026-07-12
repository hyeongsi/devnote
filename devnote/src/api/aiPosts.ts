import type { AiPostGenerateRequest, AiPostGenerateResponse } from '../types';
import { apiRequest } from './http';

const AI_POSTS_API_URL = '/api/ai/posts';

export async function generateAiPost(
  request: AiPostGenerateRequest,
): Promise<AiPostGenerateResponse> {
  return apiRequest<AiPostGenerateResponse, AiPostGenerateRequest>(`${AI_POSTS_API_URL}/generate`, {
    method: 'POST',
    withCredentials: true,
    body: request,
    statusMessages: {
      401: 'FORBIDDEN',
      403: 'FORBIDDEN',
    },
    errorMessage: 'AI 글 초안을 생성하지 못했습니다.',
  });
}
