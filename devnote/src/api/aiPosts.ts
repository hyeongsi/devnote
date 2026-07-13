import type { AiPostGenerateRequest, AiPostGenerateResponse } from '../types';
import { fetchAdmin } from './adminAuth';
import { apiRequest } from './http';

const AI_POSTS_API_URL = '/api/ai/posts';

export async function generateAiPost(
  request: AiPostGenerateRequest,
): Promise<AiPostGenerateResponse> {
  return apiRequest<AiPostGenerateResponse, AiPostGenerateRequest>(`${AI_POSTS_API_URL}/generate`, {
    method: 'POST',
    request: fetchAdmin,
    body: request,
    errorMessage: 'AI 글 초안을 생성하지 못했습니다.',
  });
}
