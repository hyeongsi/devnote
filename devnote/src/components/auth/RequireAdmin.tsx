import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';
import { AUTH_REQUIRED_EVENT, buildLoginRedirectPath } from '../../api/adminAuth';
import type { AuthUser } from '../../types';
import { isAdminUser } from './adminAccess';

export function RequireAdmin() {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        if (cancelled) {
          return;
        }

        if (isAdminUser(currentUser)) {
          setUser(currentUser);
          setStatus('authorized');
          return;
        }

        setUser(null);
        setStatus('unauthorized');
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthorized');
        }
      }
    }

    function handleAuthRequired() {
      setUser(null);
      setStatus('unauthorized');
    }

    void loadUser();
    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, []);

  if (status === 'loading') {
    return (
      <section className="section">
        <div className="rounded-[18px] border border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
          관리자 인증 상태를 확인하는 중입니다.
        </div>
      </section>
    );
  }

  if (status === 'unauthorized' || !user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(location.pathname, location.search, location.hash)}
        replace
      />
    );
  }

  return <Outlet context={{ currentUser: user }} />;
}
