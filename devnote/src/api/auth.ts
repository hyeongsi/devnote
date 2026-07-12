import type { AuthLoginRequest, AuthUser } from '../types';
import { apiRequest, isApiErrorWithStatus } from './http';

const AUTH_API_URL = '/api/auth';
export const AUTH_CHANGED_EVENT = 'devnote:auth-changed';

export async function login(request: AuthLoginRequest): Promise<AuthUser> {
  const user = await apiRequest<AuthUser, AuthLoginRequest>(`${AUTH_API_URL}/login`, {
    method: 'POST',
    withCredentials: true,
    body: request,
    statusMessages: {
      401: 'LOGIN_FAILED',
    },
    errorMessage: '로그인에 실패했습니다.',
  });
  notifyAuthChanged();

  return user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await apiRequest<AuthUser>(`${AUTH_API_URL}/me`, {
      withCredentials: true,
      errorMessage: '인증 상태를 확인하지 못했습니다.',
    });
  } catch (error) {
    if (isApiErrorWithStatus(error, 401)) {
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  await apiRequest<void>(`${AUTH_API_URL}/logout`, {
    method: 'POST',
    withCredentials: true,
    errorMessage: '로그아웃에 실패했습니다.',
  });
  notifyAuthChanged();
}

export function notifyAuthChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
