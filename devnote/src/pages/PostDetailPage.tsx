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
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';
import { deletePost, getPost, getPosts } from '../api/posts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TagList } from '../components/ui/TagList';
import { getPostPath } from '../data/siteData';
import { useFeedback } from '../features/feedback/FeedbackContext';
import { PostMarkdownRenderer } from '../features/post/PostMarkdownRenderer';
import { PostComments } from '../features/post/PostComments';
import { extractMarkdownHeadings } from '../features/post/postMarkdown';
import type { AuthUser, BlogPost, BlogPostDetail } from '../types';
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
  const navigate = useNavigate();
  const { showConfirm, showMessage } = useFeedback();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const commentPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!categorySlug || !postSlug) {
      queueMicrotask(() => {
        setPost(null);
        setPosts([]);
        setIsNotFound(true);
        setErrorMessage(null);
        setIsLoading(false);
      });
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

  useEffect(() => {
    setIsCommentPanelOpen(false);
  }, [categorySlug, postSlug]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser();

        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const headings = useMemo(
    () => (post ? extractMarkdownHeadings(post.contentMarkdown) : []),
    [post],
  );

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    let animationFrameId = 0;

    function updateActiveHeading() {
      const article = document.querySelector<HTMLElement>('[data-testid="post-article"]');
      const elements = article
        ? Array.from(article.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]'))
        : [];
      const activationOffset = 160;
      const readingPosition = window.scrollY + activationOffset;
      const currentHeading = elements.findLast((element) => {
        let offsetTop = element.offsetTop;
        let offsetParent = element.offsetParent as HTMLElement | null;

        while (offsetParent) {
          offsetTop += offsetParent.offsetTop;
          offsetParent = offsetParent.offsetParent as HTMLElement | null;
        }

        return offsetTop <= readingPosition;
      });

      setActiveHeadingId(currentHeading?.id ?? elements[0]?.id ?? '');
    }

    function handleScroll() {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(updateActiveHeading);
    }

    updateActiveHeading();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [headings]);

  const canDeletePost = currentUser?.role === 'ROLE_ADMIN';

  async function handleDeletePost() {
    if (!post || isDeleting) {
      return;
    }

    const accepted = await showConfirm({
      title: '게시글을 삭제할까요?',
      description: `"${post.title}" 게시글은 삭제 후 복구할 수 없습니다.`,
      confirmLabel: '삭제',
      cancelLabel: '취소',
      tone: 'error',
    });

    if (!accepted) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePost(post.categorySlug, post.slug);
      showMessage({
        tone: 'success',
        title: '게시글이 삭제되었습니다.',
      });
      navigate('/posts', { replace: true });
    } catch (error) {
      const description =
        error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'AUTH_REQUIRED')
          ? '관리자 권한이 있는 사용자만 게시글을 삭제할 수 있습니다.'
          : error instanceof Error
            ? error.message
            : '다시 시도해 주세요.';

      showMessage({
        tone: 'error',
        title: '게시글 삭제에 실패했습니다.',
        description,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenComments() {
    setIsCommentPanelOpen(true);

    window.requestAnimationFrame(() => {
      commentPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

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
    <section className="section">
      <div
        data-testid="post-reading-grid"
        className="grid gap-10 lg:grid-cols-[minmax(0,800px)_260px] lg:items-start lg:justify-center lg:gap-x-16"
      >
      <article data-testid="post-article" className="min-w-0 max-w-full overflow-hidden">
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

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <h1 className="max-w-[760px] text-[31px] font-extrabold leading-[1.25] tracking-tight text-gray-950 md:text-[42px]">
            {post.title}
          </h1>
          {canDeletePost ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
              disabled={isDeleting}
              onClick={() => void handleDeletePost()}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? '삭제 중' : '삭제'}
            </Button>
          ) : null}
        </div>
        <p className="mt-5 max-w-[760px] text-[17px] leading-8 text-gray-600">{post.excerpt}</p>

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
          className={`my-10 grid h-36 place-items-center rounded-lg bg-gradient-to-br ${hero.className} md:h-44`}
        >
          <div className="grid h-20 w-20 place-items-center rounded-lg border border-white/75 bg-white/70 shadow-[0_12px_28px_rgba(17,24,39,0.07)] [&>svg]:h-11 [&>svg]:w-11">
            {hero.icon}
          </div>
        </div>

        <PostMarkdownRenderer markdown={post.contentMarkdown} />

        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" />
            좋아요 128
          </Button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:-translate-y-0.5"
            aria-expanded={isCommentPanelOpen}
            aria-controls="post-comments"
            onClick={handleOpenComments}
          >
            <MessageSquareShare className="h-4 w-4" />
            {isCommentPanelOpen ? '댓글 보기 중' : '댓글'}
          </button>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            공유하기
          </Button>
        </div>

        <div id="post-comments" ref={commentPanelRef} className="scroll-mt-24">
          {isCommentPanelOpen ? (
            <PostComments categorySlug={post.categorySlug} postSlug={post.slug} />
          ) : null}
        </div>
      </article>

      <nav
        aria-label="게시글 목차"
        className="order-first border-y border-line py-5 lg:sticky lg:top-24 lg:order-none lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:border-y-0 lg:border-l lg:py-2 lg:pl-7 lg:pr-2"
      >
        <h3 className="text-sm font-extrabold text-gray-950">목차</h3>
        <div className="mt-4 grid gap-0.5 text-sm">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={`border-l-2 py-1.5 leading-6 transition ${
                heading.level >= 3 ? 'pl-6 text-[13px]' : 'pl-3'
              } ${
                activeHeadingId === heading.id || (!activeHeadingId && headings[0]?.id === heading.id)
                  ? 'border-primary font-bold text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {heading.text}
            </a>
          ))}
        </div>
      </nav>
      </div>

      <div data-testid="post-navigation" className="mt-10 lg:mx-auto lg:w-[1124px]">
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
