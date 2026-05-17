import {
  BarChart3,
  Bot,
  Code2,
  Database,
  Eye,
  Heart,
  Laptop2,
  LockKeyhole,
  MessageSquareShare,
  Package,
  ServerCog,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TagList } from '../components/ui/TagList';
import { allBlogPosts, getPostPath } from '../data/siteData';
import type { BlogPost } from '../types';

const heroStyles: Record<BlogPost['imageStyle'], { icon: ReactNode; className: string }> = {
  ai: {
    icon: <Bot className="h-16 w-16" />,
    className: 'from-[#f2efff] via-white to-[#e2dcff] text-primary',
  },
  laptop: {
    icon: <Laptop2 className="h-16 w-16" />,
    className: 'from-[#f5f5f5] via-white to-[#ebeef8] text-slate-700',
  },
  docker: {
    icon: <Package className="h-16 w-16" />,
    className: 'from-[#eef7ff] via-white to-[#dff0ff] text-sky-600',
  },
  code: {
    icon: <Code2 className="h-16 w-16" />,
    className: 'from-[#1e2230] via-[#0f172a] to-[#111827] text-white',
  },
  chart: {
    icon: <BarChart3 className="h-16 w-16" />,
    className: 'from-[#f2fbff] via-white to-[#e5f4ff] text-cyan-600',
  },
  security: {
    icon: <LockKeyhole className="h-16 w-16" />,
    className: 'from-[#f4efff] via-white to-[#ebdfff] text-violet-600',
  },
  data: {
    icon: <Database className="h-16 w-16" />,
    className: 'from-[#f6f7fb] via-white to-[#eceff9] text-slate-600',
  },
  monitor: {
    icon: <ServerCog className="h-16 w-16" />,
    className: 'from-[#ecfbff] via-white to-[#dcf7ff] text-teal-600',
  },
};

const stackMap: Record<BlogPost['imageStyle'], string> = {
  ai: 'OpenAI API, Spring Boot, Scheduler',
  laptop: '@ControllerAdvice, ResponseEntity, Validation',
  docker: 'Docker, Docker Compose, Nginx',
  code: 'Java 17, Records, Sealed Classes',
  chart: 'Jsoup, Batch, Spring Scheduler',
  security: 'Spring Security, JWT, Redis',
  data: 'Spring Data JPA, Querydsl, MySQL',
  monitor: 'Actuator, Prometheus, Grafana',
};

export function PostDetailPage() {
  const { categorySlug, postSlug } = useParams();
  const post = allBlogPosts.find(
    (item) => item.categorySlug === categorySlug && item.slug === postSlug,
  );

  if (!post) {
    return (
      <section className="section">
        <Card className="rounded-[28px] p-8 text-center">
          <p className="text-sm font-bold text-primary">404</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950">
            게시글을 찾을 수 없습니다
          </h1>
          <p className="mt-3 text-muted">
            삭제되었거나 주소가 변경된 게시글입니다. 목록으로 돌아가 다시 확인해 주세요.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/posts">
              <Button>게시글 목록 보기</Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const hero = heroStyles[post.imageStyle];
  const sections = buildSections(post);
  const previousPost = allBlogPosts.find((item) => item.id === post.id - 1);
  const nextPost = allBlogPosts.find((item) => item.id === post.id + 1);

  return (
    <section className="section grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
      <article>
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="font-medium transition hover:text-primary">
            홈
          </Link>
          <span>/</span>
          <Link to="/posts" className="font-medium transition hover:text-primary">
            블로그
          </Link>
          <span>/</span>
          <Link to={`/posts/${post.categorySlug}`} className="font-medium transition hover:text-primary">
            {post.category}
          </Link>
        </div>

        <h1 className="text-[31px] font-extrabold leading-tight tracking-tight text-gray-950 md:text-[42px]">
          {post.title}
        </h1>
        <p className="mt-4 leading-8 text-muted">{post.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
          <strong className="text-gray-900">DevNote</strong>
          <span>{post.date}</span>
          <span>{post.readTime}</span>
          <span>조회 {post.views}</span>
        </div>

        <div className="mt-5">
          <TagList tags={post.tags} />
        </div>

        <div
          className={`my-8 grid h-56 place-items-center rounded-[28px] bg-gradient-to-br ${hero.className} md:h-[330px]`}
        >
          <div className="grid h-28 w-28 place-items-center rounded-[30px] border border-white/75 bg-white/70 shadow-[0_18px_42px_rgba(17,24,39,0.08)] md:h-32 md:w-32">
            {hero.icon}
          </div>
        </div>

        {sections.map((section) => (
          <ArticleSection key={section.id} id={section.id} title={section.title}>
            {section.content}
          </ArticleSection>
        ))}

        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" />
            좋아요 128
          </Button>
          <Button variant="outline" className="gap-2">
            <MessageSquareShare className="h-4 w-4" />
            댓글 16
          </Button>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            공유하기
          </Button>
        </div>

        <div className="mt-8 grid gap-3 rounded-[24px] border border-line bg-white p-4 sm:grid-cols-2">
          <Link
            to={previousPost ? getPostPath(previousPost) : '/posts'}
            className="rounded-[18px] border border-line px-4 py-4 transition hover:border-primary hover:text-primary"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">이전 글</p>
            <p className="mt-2 font-bold text-gray-900">
              {previousPost ? previousPost.title : '목록으로 돌아가기'}
            </p>
          </Link>
          <Link
            to={nextPost ? getPostPath(nextPost) : '/posts'}
            className="rounded-[18px] border border-line px-4 py-4 transition hover:border-primary hover:text-primary"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">다음 글</p>
            <p className="mt-2 font-bold text-gray-900">
              {nextPost ? nextPost.title : '다른 게시글 보기'}
            </p>
          </Link>
        </div>
      </article>

      <Card className="order-first rounded-[24px] p-6 lg:sticky lg:top-24 lg:order-none">
        <h3 className="font-extrabold text-gray-950">목차</h3>
        <div className="mt-4 grid gap-3 text-sm text-muted">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="transition hover:text-primary">
              {section.title}
            </a>
          ))}
        </div>
      </Card>
    </section>
  );
}

function buildSections(post: BlogPost) {
  const stack = stackMap[post.imageStyle];

  return [
    {
      id: 'overview',
      title: '1. 개요',
      content: (
        <>
          <p>
            이 글은 {post.title}를 실제 프로젝트 흐름 안에서 어떻게 풀어냈는지 정리한 내용입니다.
            단순 기능 소개를 넘어서, 왜 이런 구조를 택했고 운영 관점에서 무엇을 신경 썼는지도 함께 담았습니다.
          </p>
          <div className="rounded-2xl border-l-4 border-primary bg-[#f8f7ff] p-6 text-gray-600">
            핵심 목표: 빠르게 구현하되, 이후 확장과 유지보수에 무리가 없는 구조를 만드는 것
          </div>
        </>
      ),
    },
    {
      id: 'architecture',
      title: '2. 구현 흐름',
      content: (
        <>
          <p>
            전체 작업은 요구사항 정리, 핵심 로직 구현, 예외 처리, 운영 자동화 순으로 나눠 진행했습니다.
            각 단계가 서로 과하게 결합되지 않도록 역할을 분리해 이후 수정 비용을 줄였습니다.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {['요구사항 정리', '핵심 로직 구현', '예외 처리', '운영 자동화'].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-line bg-white p-5 text-center font-bold text-gray-600"
              >
                {item}
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'stack',
      title: '3. 기술 스택',
      content: (
        <>
          <p>
            주제에 따라 조금씩 달라지지만, 이 글에서 중심이 되는 기술 조합은 아래와 같습니다.
          </p>
          <pre className="overflow-auto rounded-2xl bg-slate-950 p-6 text-sm leading-7 text-blue-100">
            <code>{`{
  "category": "${post.category}",
  "topic": "${post.title}",
  "stack": "${stack}",
  "routing": "React Router",
  "ui": "React + Tailwind CSS"
}`}</code>
          </pre>
        </>
      ),
    },
    {
      id: 'retrospective',
      title: '4. 정리',
      content: (
        <p>
          {post.title}처럼 설명형 콘텐츠는 목록에서 끝나지 않고 자연스럽게 상세로 이어져야 읽는 흐름이 살아납니다.
          이번 작업에서는 바로 그 흐름을 만들기 위해 카드 클릭, 상세 라우트, 본문 레이아웃, 이전/다음 글 이동까지
          한 번에 연결했습니다.
        </p>
      ),
    },
  ];
}

function ArticleSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="mb-4 text-2xl font-extrabold text-gray-950">{title}</h2>
      <div className="space-y-4 text-[17px] leading-9 text-gray-600">{children}</div>
    </section>
  );
}
