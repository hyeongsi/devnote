import { Chrome, EyeOff, Github, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { loginProviders } from '../data/siteData';

export function LoginPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('admin@devnote.dev');
  const [password, setPassword] = useState('devnote-admin-1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirect') || '/admin';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
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
    <section className="section">
      <div className="grid overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_20px_80px_rgba(17,24,39,0.06)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#f3f0ff_44%,#edeaff_100%)] px-8 py-10 md:px-12 md:py-16">
          <div className="max-w-xl">
            <p className="text-xl font-extrabold text-primary">개발과 자동화를 기록합니다</p>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-gray-950 md:text-6xl">
              DevNote 관리자 화면을
              <br />
              안전하게 연결합니다
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              로그인 화면이 실제 스프링 시큐리티 인증과 연결됩니다.
              <br />
              아래 임시 관리자 계정으로 바로 확인할 수 있습니다.
            </p>
          </div>

          <div className="mt-10 rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_50px_rgba(125,103,255,0.12)]">
            <p className="text-sm font-bold text-gray-900">임시 관리자 계정</p>
            <p className="mt-3 text-sm text-muted">이메일: admin@devnote.dev</p>
            <p className="mt-1 text-sm text-muted">비밀번호: devnote-admin-1234</p>
          </div>

          <div className="relative mt-12 flex min-h-[300px] items-center justify-center">
            <div className="absolute h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative rounded-[34px] bg-white p-8 shadow-[0_30px_90px_rgba(125,103,255,0.18)]">
              <div className="grid h-48 w-40 place-items-center rounded-[30px] bg-gradient-to-br from-[#9d91ff] via-[#7d6cff] to-[#5f4eff] text-white shadow-[0_30px_60px_rgba(109,93,252,0.35)]">
                <span className="text-7xl font-black">&lt;/&gt;</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 md:px-12 md:py-16">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black tracking-tight text-gray-950">로그인</h2>
            <p className="mt-3 text-lg text-muted">관리자 권한이 있는 계정으로 인증한 뒤 어드민 화면으로 이동합니다.</p>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <Field label="이메일">
                <IconField
                  icon={<Mail className="h-5 w-5" />}
                  placeholder="이메일 주소를 입력하세요"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field label="비밀번호">
                <IconField
                  icon={<Lock className="h-5 w-5" />}
                  placeholder="비밀번호를 입력하세요"
                  suffix={<EyeOff className="h-5 w-5" />}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 font-semibold text-gray-600">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line accent-primary" />
                  로그인 상태 유지
                </label>
                <button type="button" className="font-bold text-primary">
                  비밀번호 찾기
                </button>
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? '로그인 중...' : '로그인'}
              </Button>
            </form>

            <div className="my-8 flex items-center gap-4 text-sm text-muted">
              <div className="h-px flex-1 bg-line" />
              또는
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="space-y-3">
              {loginProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-base font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  {provider.icon === 'github' && <Github className="h-5 w-5" />}
                  {provider.icon === 'chrome' && <Chrome className="h-5 w-5" />}
                  {provider.icon === 'mail' && <Mail className="h-5 w-5" />}
                  {provider.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-3 block text-base font-bold text-gray-950">{label}</span>
      {children}
    </label>
  );
}

function IconField({
  icon,
  suffix,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-[0_10px_35px_rgba(17,24,39,0.03)]">
      <span className="text-gray-400">{icon}</span>
      <Input className="border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0" {...props} />
      {suffix ? <span className="text-gray-400">{suffix}</span> : null}
    </div>
  );
}
