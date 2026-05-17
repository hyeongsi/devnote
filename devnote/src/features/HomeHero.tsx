import type { ReactNode } from 'react';
import {
  Code2,
  Github,
  Home,
  Linkedin,
  Mail,
  Settings,
  UserRound,
  VenetianMask,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function HomeHero() {
  const navigate = useNavigate();

  return (
    <section className="section pb-6">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.08fr]">
        <div>
          <p className="text-xl font-extrabold text-primary">개발과 자동화를 기록합니다.</p>
          <h1 className="mt-6 text-[46px] font-black leading-tight tracking-[-2px] text-gray-950 md:text-[74px]">
            AI로 자동화하는
            <br />
            개발 블로그
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-9 text-muted">
            개발, 자동화, AI에 대한 인사이트와
            <br />
            프로젝트 경험을 공유하는 공간입니다.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" variant="dark" onClick={() => navigate('/posts')}>
              최신 글 보러가기 →
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/posts/devops')}>
              포트폴리오 보기
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-4 text-gray-600">
            <SocialIcon icon={<Github className="h-5 w-5" />} />
            <SocialIcon icon={<VenetianMask className="h-5 w-5" />} />
            <SocialIcon icon={<Linkedin className="h-5 w-5" />} />
          </div>
        </div>

        <div className="relative min-h-[420px]">
          <div className="absolute left-6 top-14 hidden w-14 rounded-[22px] border border-line bg-white px-3 py-5 shadow-[0_24px_60px_rgba(17,24,39,0.06)] md:grid md:gap-4">
            {[Home, UserRound, Mail, Code2, Settings].map((Icon, index) => (
              <div key={index} className="grid h-9 w-9 place-items-center rounded-xl bg-[#fafaff] text-gray-400">
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>
          <div className="absolute left-24 top-10 h-72 w-60 rounded-[26px] border border-line bg-white p-6 shadow-[0_30px_80px_rgba(17,24,39,0.06)]">
            <p className="text-sm font-semibold text-muted">Visitor</p>
            <strong className="mt-3 block text-5xl font-black tracking-tight text-gray-950">12,548</strong>
            <span className="ml-2 text-sm font-bold text-emerald-500">+24.5%</span>
            <svg viewBox="0 0 220 90" className="mt-6 h-24 w-full">
              <path
                d="M10 62 C30 30, 55 74, 80 46 S125 20, 150 48 S190 52, 210 18"
                fill="none"
                stroke="#6d5dfc"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="absolute bottom-8 left-32 h-40 w-64 rounded-[26px] border border-line bg-white p-6 shadow-[0_30px_80px_rgba(17,24,39,0.06)]">
            <p className="text-sm font-semibold text-muted">Post</p>
            <strong className="mt-3 block text-5xl font-black tracking-tight text-gray-950">156</strong>
            <span className="ml-2 text-sm font-bold text-emerald-500">+18.2%</span>
            <div className="mt-6 h-3 rounded-full bg-primary-soft">
              <div className="h-3 w-2/3 rounded-full bg-primary" />
            </div>
          </div>
          <div className="absolute right-2 top-8 rotate-12 rounded-[22px] bg-gradient-to-br from-[#8a7cff] to-[#6d5dfc] px-6 py-5 text-5xl font-black text-white shadow-[0_24px_60px_rgba(109,93,252,0.3)]">
            AI
          </div>
          <div className="absolute right-0 top-28 w-[360px] max-w-full rounded-[28px] bg-[#171b26] px-6 py-5 text-white shadow-[0_30px_90px_rgba(17,24,39,0.24)]">
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-gray-200">
              <Code2 className="h-4 w-4 text-primary" />
              automation.py
            </div>
            <pre className="overflow-hidden text-sm leading-7 text-gray-300">
              <code>{`1  import openai
2  import schedule

4  def generate_post(topic):
5      response = openai.chat.completions.create(
6          model="gpt-4-turbo",
7          messages=[
8              {"role":"system","content":"너는 개발 블로거야"},
9              {"role":"user","content": topic},
10         ]
11     )
12     return response.choices[0].message.content`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ icon }: { icon: ReactNode }) {
  return (
    <button
      type="button"
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition hover:border-primary hover:text-primary"
    >
      {icon}
    </button>
  );
}
