import { Github, Linkedin, Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublicMenus } from '../../hooks/usePublicMenus';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const introLinks = [
  { label: '소개 (About)', to: '/' },
  { label: '문의 (Contact)', to: '/' },
  { label: '방명록', to: '/' },
];

export function Footer() {
  const navigate = useNavigate();
  const footerLinks = usePublicMenus();

  return (
    <footer className="border-t border-line px-5 pb-10 pt-6 md:px-8 xl:px-12">
      <section className="my-8 grid gap-4 rounded-[22px] border border-white/80 bg-gradient-to-r from-primary-soft via-white to-primary-soft/50 p-5 shadow-[0_20px_60px_rgba(125,103,255,0.08)] md:grid-cols-[1.3fr_1fr_auto] md:items-center md:p-7">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary shadow-[0_12px_28px_rgba(109,93,252,0.18)]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <strong className="block text-lg font-extrabold text-gray-950 md:text-xl">새로운 글 소식을 이메일로 받아보세요</strong>
            <p className="mt-1 text-sm text-muted">블로그 업데이트 소식을 놓치지 마세요.</p>
          </div>
        </div>
        <Input placeholder="이메일 주소 입력" />
        <Button onClick={() => navigate('/login')}>구독하기</Button>
      </section>

      <div className="grid gap-8 pb-4 md:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr]">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-gray-950">DevNote</h3>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
            개발과 자동화, AI에 대한 기록을 남기는 공간입니다.
          </p>
          <small className="mt-6 block text-sm text-muted">© 2024 DevNote. All rights reserved.</small>
        </div>

        <FooterColumn title="링크" links={footerLinks} />
        <FooterColumn title="소개" links={introLinks} />

        <div>
          <h4 className="font-bold text-gray-950">연결</h4>
          <div className="mt-4 flex items-center gap-3 text-gray-700">
            <SocialBadge ariaLabel="GitHub">
              <Github className="h-4 w-4" />
            </SocialBadge>
            <SocialBadge ariaLabel="Velog">
              <span className="text-sm font-black">V</span>
            </SocialBadge>
            <SocialBadge ariaLabel="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </SocialBadge>
            <SocialBadge ariaLabel="Mail">
              <Mail className="h-4 w-4" />
            </SocialBadge>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h4 className="font-bold text-gray-950">{title}</h4>
      <div className="mt-4 grid gap-2 text-sm text-muted">
        {links.map((link) => (
          <Link key={`${link.label}-${link.to}`} to={link.to} className="transition hover:text-primary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SocialBadge({
  children,
  ariaLabel,
}: {
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition hover:border-primary hover:text-primary"
    >
      {children}
    </button>
  );
}
