import { EyeOff, Lock, Mail, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Outlet } from 'react-router-dom';
import { getCurrentUser, login } from '../../api/auth';
import type { AuthUser } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { isAdminUser } from './adminAccess';

export function RequireAdmin() {
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

    void loadUser();

    return () => {
      cancelled = true;
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
      <AdminLoginDialog
        onLogin={(nextUser) => {
          setUser(nextUser);
          setStatus('authorized');
        }}
      />
    );
  }

  return <Outlet context={{ currentUser: user }} />;
}

function AdminLoginDialog({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('admin@devnote.dev');
  const [password, setPassword] = useState('devnote-admin-1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const user = await login({ email, password });
      if (!isAdminUser(user)) {
        setError('관리자 권한이 있는 계정으로 로그인해주세요.');
        return;
      }

      onLogin(user);
    } catch (submitError) {
      if (submitError instanceof Error && submitError.message === 'LOGIN_FAILED') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError('로그인 중 문제가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/35 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="관리자 로그인"
        className="w-full max-w-[460px] overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(17,24,39,0.22)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <p className="text-sm font-bold text-primary">Admin Access</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-950">관리자 로그인</h1>
            <p className="mt-2 text-sm leading-6 text-muted">관리자 화면으로 이동하려면 먼저 로그인해주세요.</p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            onClick={() => window.history.back()}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-950">이메일</span>
            <div className="flex items-center gap-3 rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_10px_35px_rgba(17,24,39,0.03)]">
              <Mail className="h-5 w-5 text-gray-400" />
              <Input
                className="border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일 주소"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-950">비밀번호</span>
            <div className="flex items-center gap-3 rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_10px_35px_rgba(17,24,39,0.03)]">
              <Lock className="h-5 w-5 text-gray-400" />
              <Input
                className="border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
              />
              <EyeOff className="h-5 w-5 text-gray-400" />
            </div>
          </label>

          {error ? (
            <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </section>
    </div>
  );
}
