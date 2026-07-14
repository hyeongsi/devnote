import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';
import { AUTH_REQUIRED_EVENT, buildLoginRedirectPath } from '../../api/adminAuth';
import { useFeedback } from '../../features/feedback/FeedbackContext';
import type { AuthUser } from '../../types';
import { isAdminUser } from './adminAccess';

const ADMIN_AUTH_CHECK_ERROR_TITLE = '관리자 인증 확인 실패';
const ADMIN_AUTH_CHECK_ERROR_FALLBACK_MESSAGE =
  '관리자 인증 상태를 확인하지 못했습니다. 첫 화면으로 이동합니다.';

export function RequireAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showMessage } = useFeedback();
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
      } catch (error) {
        if (cancelled) {
          return;
        }

        setUser(null);
        showMessage({
          title: ADMIN_AUTH_CHECK_ERROR_TITLE,
          description:
            error instanceof Error ? error.message : ADMIN_AUTH_CHECK_ERROR_FALLBACK_MESSAGE,
          tone: 'error',
          durationMs: 5000,
        });
        navigate('/', { replace: true });
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
  }, [navigate, showMessage]);

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
