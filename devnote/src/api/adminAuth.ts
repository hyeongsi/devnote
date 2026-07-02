export const AUTH_REQUIRED_EVENT = 'devnote:auth-required';
export const AUTH_REQUIRED_ERROR = 'AUTH_REQUIRED';

export function buildLoginRedirectPath(pathname: string, search = '', hash = '') {
  const redirectTarget = `${pathname}${search}${hash}`;
  return `/login?redirect=${encodeURIComponent(redirectTarget)}`;
}

export async function fetchAdmin(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const response = await fetch(input, {
      credentials: 'include',
      ...init,
    });

    if (response.status === 401 || response.status === 403) {
      notifyAuthRequired();
      throw new Error(AUTH_REQUIRED_ERROR);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
      throw error;
    }

    notifyAuthRequired();
    throw new Error(AUTH_REQUIRED_ERROR);
  }
}

function notifyAuthRequired() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}
