import type { AuthLoginRequest, AuthUser } from '../types';

const AUTH_API_URL = 'http://localhost:8080/api/auth';
export const AUTH_CHANGED_EVENT = 'devnote:auth-changed';

export async function login(request: AuthLoginRequest): Promise<AuthUser> {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (response.status === 401) {
    throw new Error('LOGIN_FAILED');
  }

  if (!response.ok) {
    throw new Error(`로그인에 실패했습니다. (${response.status})`);
  }

  const user = (await response.json()) as AuthUser;
  notifyAuthChanged();

  return user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${AUTH_API_URL}/me`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`인증 상태를 확인하지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as AuthUser;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`로그아웃에 실패했습니다. (${response.status})`);
  }

  notifyAuthChanged();
}

export function notifyAuthChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
