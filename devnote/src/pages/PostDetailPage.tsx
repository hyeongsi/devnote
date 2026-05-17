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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPost, getPosts } from '../api/posts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TagList } from '../components/ui/TagList';
import { getPostPath } from '../data/siteData';
import { PostMarkdownRenderer } from '../features/post/PostMarkdownRenderer';
import { extractMarkdownHeadings } from '../features/post/postMarkdown';
import type { BlogPost, BlogPostDetail } from '../types';
import { formatViewCount } from '../utils/postMetadata';

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

export function PostDetailPage() {
  const { categorySlug, postSlug } = useParams();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug || !postSlug) {
      setPost(null);
      setPosts([]);
      setIsNotFound(true);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    const resolvedCategorySlug = categorySlug;
    const resolvedPostSlug = postSlug;
    let isMounted = true;

    async function loadPostDetail() {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage(null);

      try {
        const [nextPost, nextPosts] = await Promise.all([
          getPost(resolvedCategorySlug, resolvedPostSlug),
          getPosts(),
        ]);

        if (!isMounted) {
          return;
        }

        setPost(nextPost);
        setPosts(nextPosts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPost(null);
        setPosts([]);

        if (error instanceof Error && error.message === 'POST_NOT_FOUND') {
          setIsNotFound(true);
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '게시글 상세를 불러오지 못했습니다.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPostDetail();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, postSlug]);

  const headings = useMemo(
    () => (post ? extractMarkdownHeadings(post.contentMarkdown) : []),
    [post],
  );

  if (isLoading) {
    return (
      <section className="section">
        <Card className="rounded-[28px] p-8 text-center">
          <p className="text-sm font-bold text-primary">Loading</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950">
            게시글을 불러오는 중입니다
          </h1>
          <p className="mt-3 text-muted">선택한 게시글 상세 데이터를 백엔드에서 가져오고 있습니다.</p>
        </Card>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="section">
        <Card className="rounded-[28px] p-8 text-center">
          <p className="text-sm font-bold text-primary">Error</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950">
            게시글 상세를 불러오지 못했습니다
          </h1>
          <p className="mt-3 text-muted">{errorMessage}</p>
          <div className="mt-6 flex justify-center">
            <Link to="/posts">
              <Button>게시글 목록 보기</Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  if (!post || isNotFound) {
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
  const currentPostIndex = posts.findIndex((item) => item.id === post.id);
  const previousPost = currentPostIndex >= 0 ? posts[currentPostIndex + 1] : undefined;
  const nextPost = currentPostIndex > 0 ? posts[currentPostIndex - 1] : undefined;

  return (
    <section className="section grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
      <article className="lg:pl-4 xl:pl-6">
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
          <span>{post.displayDate}</span>
          <span>{post.readTime}</span>
          <span>조회 {formatViewCount(post.viewCount)}</span>
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

        <PostMarkdownRenderer markdown={post.contentMarkdown} />

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
      </article>

      <Card className="order-first rounded-[24px] p-6 lg:sticky lg:top-24 lg:order-none">
        <h3 className="font-extrabold text-gray-950">목차</h3>
        <div className="mt-4 grid gap-3 text-sm text-muted">
          {headings.map((heading) => (
            <a key={heading.id} href={`#${heading.id}`} className="transition hover:text-primary">
              {heading.text}
            </a>
          ))}
        </div>
      </Card>

      <div className="lg:col-span-2">
        <div className="grid gap-3 rounded-[24px] border border-line bg-white p-4 sm:grid-cols-2">
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
      </div>
    </section>
  );
}
