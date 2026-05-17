import {
  BarChart3,
  Bot,
  Code2,
  Database,
  Laptop2,
  LockKeyhole,
  Package,
  ServerCog,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getPostPath } from '../data/siteData';
import type { BlogPost } from '../types';

const thumbStyles: Record<BlogPost['imageStyle'], { icon: ReactNode; className: string }> = {
  ai: {
    icon: <Bot className="h-12 w-12" />,
    className: 'from-[#f2efff] via-white to-[#e2dcff] text-primary',
  },
  laptop: {
    icon: <Laptop2 className="h-12 w-12" />,
    className: 'from-[#f5f5f5] via-white to-[#ebeef8] text-slate-700',
  },
  docker: {
    icon: <Package className="h-12 w-12" />,
    className: 'from-[#eef7ff] via-white to-[#dff0ff] text-sky-600',
  },
  code: {
    icon: <Code2 className="h-12 w-12" />,
    className: 'from-[#1e2230] via-[#0f172a] to-[#111827] text-white',
  },
  chart: {
    icon: <BarChart3 className="h-12 w-12" />,
    className: 'from-[#f2fbff] via-white to-[#e5f4ff] text-cyan-600',
  },
  security: {
    icon: <LockKeyhole className="h-12 w-12" />,
    className: 'from-[#f4efff] via-white to-[#ebdfff] text-violet-600',
  },
  data: {
    icon: <Database className="h-12 w-12" />,
    className: 'from-[#f6f7fb] via-white to-[#eceff9] text-slate-600',
  },
  monitor: {
    icon: <ServerCog className="h-12 w-12" />,
    className: 'from-[#ecfbff] via-white to-[#dcf7ff] text-teal-600',
  },
};

export function PostListItem({ post }: { post: BlogPost }) {
  const thumb = thumbStyles[post.imageStyle];

  return (
    <Link
      to={getPostPath(post)}
      className="block rounded-[24px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <article className="grid gap-5 rounded-[24px] border border-line bg-white p-4 shadow-[0_14px_50px_rgba(17,24,39,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(17,24,39,0.07)] md:grid-cols-[220px_1fr]">
        <div
          className={`grid min-h-[160px] place-items-center rounded-[20px] bg-gradient-to-br ${thumb.className}`}
        >
          <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-white/70 bg-white/70 shadow-[0_18px_42px_rgba(255,255,255,0.4)]">
            {thumb.icon}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold text-primary">{post.category}</p>
          <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-950 md:text-[32px]">
            {post.title}
          </h3>
          <p className="mt-3 text-base leading-7 text-muted">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
            <span>{post.date}</span>
            <span>{post.readTime}</span>
            <span>조회 {post.views}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
