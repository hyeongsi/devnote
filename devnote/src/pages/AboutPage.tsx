import {
  Bot,
  Code2,
  Container,
  Eye,
  FileText,
  LayoutGrid,
  Server,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getPosts } from '../api/posts';
import { buildAboutStats } from '../features/homeContent';
import type { BlogPost } from '../types';

const topics = [
  {
    icon: Server,
    title: 'Backend',
    description: 'Spring Boot, FastAPI, 데이터베이스, API 설계 등 백엔드 개발 실무를 다룹니다.',
  },
  {
    icon: Bot,
    title: 'AI 자동화',
    description: 'LLM 활용, RAG, 자동화 파이프라인 구축 등 AI 기술을 실제 업무에 적용한 내용을 기록합니다.',
  },
  {
    icon: Container,
    title: 'DevOps',
    description: 'Docker, Kubernetes, CI/CD, 모니터링까지 안정적인 서비스 운영을 위한 인프라를 다룹니다.',
  },
];

const principles = [
  ['직접 적용한 내용을 씁니다', '이론보다 실제 프로젝트나 운영 환경에서 검증한 경험을 우선합니다.'],
  ['재현 가능한 예제를 남깁니다', '코드, 설정, 명령어, 결과를 함께 제공하여 독자가 직접 따라 할 수 있게 합니다.'],
  ['운영 관점까지 정리합니다', '개발뿐만 아니라 배포, 모니터링, 장애 대응 등 운영 관점까지 함께 다룹니다.'],
];

export function AboutPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [statsAvailable, setStatsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPosts()
      .then((nextPosts) => {
        if (!cancelled) {
          setPosts(nextPosts);
          setStatsAvailable(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatsAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => buildAboutStats(posts), [posts]);

  return (
    <>
      <section className="border-b border-slate-200 bg-[#eef0f5] px-5 py-14 md:px-8 xl:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold text-primary">ABOUT DEVNOTE</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-gray-950 md:text-5xl">
              개발과 자동화를
              <br />
              기록하는 공간
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-gray-600">
              백엔드 개발, AI 자동화, 인프라 운영까지 실무에서 겪고 해결한 경험을 정리하고
              공유합니다.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#171a20] shadow-[0_20px_60px_rgba(17,24,39,0.2)]">
            <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="grid min-h-72 sm:grid-cols-[1fr_190px]">
              <pre className="overflow-hidden p-5 text-xs leading-6 text-gray-400">
                <code>{`from fastapi import FastAPI
from scheduler import AutoPost

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

scheduler.start()`}</code>
              </pre>
              <div className="border-l border-white/10 bg-[#20242b] p-4 text-white">
                <p className="text-xs font-bold">자동 포스팅 대시보드</p>
                <div className="mt-4 space-y-3 text-[11px]">
                  <div className="rounded-md bg-white/5 p-3">마지막 실행<br /><strong>2026-06-10 08:30</strong></div>
                  <div className="rounded-md bg-white/5 p-3">다음 실행<br /><strong>2026-06-10 15:30</strong></div>
                  <span className="inline-flex rounded bg-emerald-500/20 px-2 py-1 text-emerald-300">정상</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 xl:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-black text-gray-950">이 블로그에서 다루는 것</h2>
            <div className="mt-7 divide-y divide-line">
              {topics.map(({ icon: Icon, title, description }) => (
                <div key={title} className="grid grid-cols-[56px_1fr] gap-4 py-6 first:pt-0">
                  <span className="grid h-12 w-12 place-items-center rounded-lg border border-violet-200 bg-violet-50 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-black text-gray-950">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:border-l lg:border-line lg:pl-16">
            <h2 className="text-2xl font-black text-gray-950">기록의 원칙</h2>
            <div className="mt-7 divide-y divide-line">
              {principles.map(([title, description], index) => (
                <div key={title} className="grid grid-cols-[36px_1fr] gap-4 py-6 first:pt-0">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-black text-gray-950">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid border-y border-line sm:grid-cols-3">
        <Metric
          icon={FileText}
          value={statsAvailable ? stats.postCount.toLocaleString('ko-KR') : '-'}
          label="게시글"
        />
        <Metric
          icon={LayoutGrid}
          value={statsAvailable ? stats.categoryCount.toLocaleString('ko-KR') : '-'}
          label="카테고리"
        />
        <Metric
          icon={Eye}
          value={statsAvailable ? stats.totalViewCount.toLocaleString('ko-KR') : '-'}
          label="누적 조회"
        />
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Code2;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center border-line px-6 py-10 text-center sm:border-r sm:last:border-r-0">
      <Icon className="h-7 w-7 text-primary" />
      <strong className="mt-4 text-4xl font-black text-gray-950">{value}</strong>
      <span className="mt-2 text-sm text-muted">{label}</span>
    </div>
  );
}
