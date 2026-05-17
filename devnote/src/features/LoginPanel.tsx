import {
  Chrome,
  EyeOff,
  Github,
  Lock,
  Mail,
} from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { loginProviders } from '../data/siteData';

export function LoginPanel() {
  return (
    <section className="section">
      <div className="grid overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_20px_80px_rgba(17,24,39,0.06)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#f3f0ff_44%,#edeaff_100%)] px-8 py-10 md:px-12 md:py-16">
          <div className="max-w-xl">
            <p className="text-xl font-extrabold text-primary">개발과 자동화를 기록합니다.</p>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-gray-950 md:text-6xl">
              DevNote에 오신 것을
              <br />
              환영합니다
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              로그인하여 나만의 개발 기록을 관리하고,
              <br />
              AI 자동 포스팅 기능을 활용해 보세요.
            </p>
          </div>

          <div className="relative mt-16 flex min-h-[380px] items-center justify-center">
            <div className="absolute h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-8 left-8 h-16 w-16 rounded-[22px] border border-white/70 bg-white/70 shadow-[0_20px_50px_rgba(125,103,255,0.12)]" />
            <div className="absolute right-10 top-6 h-12 w-12 rounded-2xl border border-white/70 bg-white/75 shadow-[0_16px_40px_rgba(125,103,255,0.12)]" />
            <div className="absolute bottom-20 right-16 h-14 w-14 rounded-[18px] border border-white/70 bg-white/80 shadow-[0_20px_50px_rgba(125,103,255,0.14)]" />
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
            <p className="mt-3 text-lg text-muted">계정에 로그인하여 계속하세요.</p>

            <form className="mt-10 space-y-6">
              <Field label="이메일">
                <IconField icon={<Mail className="h-5 w-5" />} placeholder="이메일 주소를 입력하세요" />
              </Field>

              <Field label="비밀번호">
                <IconField
                  icon={<Lock className="h-5 w-5" />}
                  placeholder="비밀번호를 입력하세요"
                  suffix={<EyeOff className="h-5 w-5" />}
                  type="password"
                />
              </Field>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 font-semibold text-gray-600">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line accent-primary" />
                  로그인 상태 유지
                </label>
                <button type="button" className="font-bold text-primary">
                  비밀번호 찾기
                </button>
              </div>

              <Button className="w-full" size="lg">
                로그인
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

            <p className="mt-8 text-base text-muted">
              계정이 없으신가요?{' '}
              <button type="button" className="font-bold text-primary">
                회원가입
              </button>
            </p>
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
