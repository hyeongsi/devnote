import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { getPostPath } from '../data/siteData';
import type { BlogPost } from '../types';
import { formatViewCount } from '../utils/postMetadata';

const tones: Record<BlogPost['imageStyle'], string> = {
  ai: 'from-[#f3efff] via-white to-[#e6e0ff]',
  laptop: 'from-[#f5f5f5] via-white to-[#eef2f8]',
  docker: 'from-[#edf7ff] via-white to-[#dfefff]',
  code: 'from-[#1e2230] via-[#0f172a] to-[#111827]',
  chart: 'from-[#effbff] via-white to-[#e1f4ff]',
  security: 'from-[#f6efff] via-white to-[#ece0ff]',
  data: 'from-[#f8f8fb] via-white to-[#edf0f8]',
  monitor: 'from-[#effbff] via-white to-[#def7ff]',
};

const twoLineClampStyle = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical' as const,
  WebkitLineClamp: 2,
  overflow: 'hidden',
};

export function PostPreviewCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={getPostPath(post)}
      className="block h-full rounded-[22px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Card className="h-full overflow-hidden rounded-[22px] p-0 shadow-[0_18px_50px_rgba(17,24,39,0.04)]">
        <article className="flex h-full flex-col">
          <div className={`grid h-48 place-items-center bg-gradient-to-br ${tones[post.imageStyle]}`}>
            <div className="h-24 w-36 rounded-[22px] border border-white/80 bg-white/80 shadow-[0_18px_42px_rgba(17,24,39,0.08)]" />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-sm font-bold text-primary">{post.category}</p>
            <h3
              className="mt-3 min-h-[4.5rem] text-[28px] font-black leading-tight tracking-tight text-gray-950"
              style={twoLineClampStyle}
            >
              {post.title}
            </h3>
            <p className="mt-3 min-h-14 text-base leading-7 text-muted" style={twoLineClampStyle}>
              {post.excerpt}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-5 text-sm font-medium text-gray-500">
              <span>{post.displayDate}</span>
              <span>{post.readTime}</span>
              <span>조회 {formatViewCount(post.viewCount)}</span>
            </div>
          </div>
        </article>
      </Card>
    </Link>
  );
}
