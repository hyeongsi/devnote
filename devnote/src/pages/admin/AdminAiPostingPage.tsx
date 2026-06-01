import { BookOpenCheck, Eye, Lightbulb, Loader2, PencilLine, Save, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateAiPost } from '../../api/aiPosts';
import { getAdminCategories } from '../../api/categories';
import { createPost } from '../../api/posts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useFeedback } from '../../features/feedback/FeedbackContext';
import { PostMarkdownRenderer } from '../../features/post/PostMarkdownRenderer';
import type { AdminCategoryRow, BlogPost, PostCreateRequest } from '../../types';

const thumbnailOptions: Array<{ value: BlogPost['imageStyle']; label: string }> = [
  { value: 'ai', label: 'AI' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'docker', label: 'Docker' },
  { value: 'code', label: 'Code' },
  { value: 'chart', label: 'Chart' },
  { value: 'security', label: 'Security' },
  { value: 'data', label: 'Data' },
  { value: 'monitor', label: 'Monitor' },
];

const initialDraft: PostCreateRequest = {
  slug: '',
  categoryId: 0,
  title: '',
  excerpt: '',
  readTime: '',
  thumbnailStyle: 'laptop',
  contentMarkdown: '',
  tags: [],
};

export function AdminAiPostingPage() {
  const navigate = useNavigate();
  const { showMessage } = useFeedback();
  const [topic, setTopic] = useState('');
  const [direction, setDirection] = useState('');
  const [keywords, setKeywords] = useState('');
  const [excludedKeywords, setExcludedKeywords] = useState('');
  const [level, setLevel] = useState('초급도 이해할 수 있게');
  const [lengthHint, setLengthHint] = useState('보통');
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [draft, setDraft] = useState<PostCreateRequest>(initialDraft);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [recommendedCategorySlug, setRecommendedCategorySlug] = useState('');
  const [tagText, setTagText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const nextCategories = await getAdminCategories();

        if (!cancelled) {
          setCategories(nextCategories);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : '카테고리 목록을 불러오지 못했습니다.',
          );
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === draft.categoryId),
    [categories, draft.categoryId],
  );

  async function handleGenerate() {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      setErrorMessage('글 주제를 입력해 주세요.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await generateAiPost({ topic: trimmedTopic });
      const recommendedCategory = categories.find(
        (category) => category.slug === response.recommendedCategorySlug,
      );
      const fallbackCategory = categories[0];
      const nextCategoryId = recommendedCategory?.id ?? fallbackCategory?.id ?? 0;

      setDraft({
        slug: createSlug(response.title, trimmedTopic),
        categoryId: nextCategoryId,
        title: response.title,
        excerpt: response.summary,
        readTime: response.readTime,
        thumbnailStyle: response.thumbnailStyle,
        contentMarkdown: response.content,
        tags: response.tags,
      });
      setTagText(response.tags.join(', '));
      setRecommendedTopics(response.recommendedTopics);
      setRecommendedCategorySlug(response.recommendedCategorySlug);
      showMessage({
        tone: 'success',
        title: 'AI 글 초안을 생성했습니다.',
        description: '제목, 본문, 태그, 카테고리를 확인한 뒤 저장할 수 있습니다.',
      });
    } catch (error) {
      const description =
        error instanceof Error && error.message === 'FORBIDDEN'
          ? '관리자 권한이 필요합니다.'
          : error instanceof Error
            ? error.message
            : 'AI 글 초안을 생성하지 못했습니다.';

      setErrorMessage(description);
      showMessage({
        tone: 'error',
        title: 'AI 글 생성에 실패했습니다.',
        description,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    const tags = parseTags(tagText);
    const request = {
      ...draft,
      slug: draft.slug.trim(),
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      readTime: draft.readTime.trim(),
      contentMarkdown: draft.contentMarkdown.trim(),
      tags,
    };

    if (!request.slug || !request.categoryId || !request.title || !request.excerpt || !request.contentMarkdown) {
      setErrorMessage('제목, 요약, 본문, slug, 카테고리는 반드시 입력해야 합니다.');
      return;
    }

    if (tags.length === 0) {
      setErrorMessage('태그를 하나 이상 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedPost = await createPost(request);
      showMessage({
        tone: 'success',
        title: '게시글을 저장했습니다.',
        description: '기존 블로그 게시글 목록에서 바로 조회할 수 있습니다.',
      });
      navigate(`/posts/${savedPost.categorySlug}/${savedPost.slug}`);
    } catch (error) {
      const description =
        error instanceof Error && error.message === 'SLUG_CONFLICT'
          ? '이미 사용 중인 slug입니다. slug를 수정한 뒤 다시 저장해 주세요.'
          : error instanceof Error && error.message === 'FORBIDDEN'
            ? '게시글 저장은 관리자 권한이 필요합니다.'
            : error instanceof Error
              ? error.message
              : '게시글 저장에 실패했습니다.';

      setErrorMessage(description);
      showMessage({
        tone: 'error',
        title: '게시글 저장에 실패했습니다.',
        description,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraft<K extends keyof PostCreateRequest>(key: K, value: PostCreateRequest[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-line bg-white p-6 shadow-[0_18px_50px_rgba(17,24,39,0.05)] md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-primary">AI 자동 포스팅</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
              주제 기반 학습형 블로그 초안 생성
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">
              실제 GPT API는 호출하지 않고, 백엔드 Mock 응답으로 학습형 글 초안을 생성합니다.
              생성된 글은 수정한 뒤 기존 게시글 구조로 저장됩니다.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            API Key 저장 없음
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="rounded-[24px] p-6">
          <div className="flex items-center gap-3 border-b border-line pb-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Generate</p>
              <h3 className="text-xl font-black text-gray-950">글 생성 요청</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700">글 주제 *</span>
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="예: Spring Security"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700">원하는 글 방향</span>
              <Input
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                placeholder="예: 실무 보안 설정 중심"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">포함할 키워드</span>
                <Input
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="JWT, OAuth2"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">제외할 키워드</span>
                <Input
                  value={excludedKeywords}
                  onChange={(event) => setExcludedKeywords(event.target.value)}
                  placeholder="레거시 XML 설정"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">글 난이도</span>
                <Select value={level} onChange={(event) => setLevel(event.target.value)}>
                  <option>초급도 이해할 수 있게</option>
                  <option>중급 개발자 기준</option>
                  <option>실무 심화 중심</option>
                </Select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">예상 분량</span>
                <Select value={lengthHint} onChange={(event) => setLengthHint(event.target.value)}>
                  <option>짧게</option>
                  <option>보통</option>
                  <option>자세히</option>
                </Select>
              </label>
            </div>

            <Button type="button" className="gap-2" disabled={isGenerating} onClick={() => void handleGenerate()}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? '생성 중' : 'AI 블로그 글 생성'}
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[24px] p-6">
            <div className="flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-600">Draft</p>
                  <h3 className="text-xl font-black text-gray-950">생성 결과 편집</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={isPreviewMode ? 'primary' : 'outline'}
                  className="gap-2"
                  disabled={!draft.contentMarkdown}
                  onClick={() => setIsPreviewMode((current) => !current)}
                >
                  {isPreviewMode ? <PencilLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {isPreviewMode ? '편집하기' : '미리보기'}
                </Button>
                <Button
                  type="button"
                  variant="dark"
                  className="gap-2"
                  disabled={isSaving || !draft.title}
                  onClick={() => void handleSave()}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? '저장 중' : '게시글 저장'}
                </Button>
              </div>
            </div>

            {isPreviewMode ? (
              <article className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-7">
                {draft.title ? (
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-950">
                    {draft.title}
                  </h1>
                ) : (
                  <p className="text-sm font-semibold text-muted">미리볼 제목이 없습니다.</p>
                )}

                {draft.excerpt ? (
                  <p className="mt-4 text-base leading-8 text-muted">{draft.excerpt}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
                  {selectedCategory ? <span>{selectedCategory.name}</span> : null}
                  {draft.readTime ? <span>{draft.readTime}</span> : null}
                  {draft.thumbnailStyle ? <span>{draft.thumbnailStyle}</span> : null}
                </div>

                {parseTags(tagText).length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {parseTags(tagText).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-8 border-t border-line pt-2">
                  {draft.contentMarkdown ? (
                    <PostMarkdownRenderer markdown={draft.contentMarkdown} />
                  ) : (
                    <p className="mt-6 text-sm text-muted">미리볼 본문이 없습니다.</p>
                  )}
                </div>
              </article>
            ) : (
              <div className="mt-6 grid gap-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">제목</span>
                    <Input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Slug</span>
                    <Input value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">요약</span>
                  <Textarea
                    className="min-h-24"
                    value={draft.excerpt}
                    onChange={(event) => updateDraft('excerpt', event.target.value)}
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">카테고리</span>
                    <Select
                      value={draft.categoryId || ''}
                      onChange={(event) => updateDraft('categoryId', Number(event.target.value))}
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category.id ?? category.slug} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">예상 읽기 시간</span>
                    <Input value={draft.readTime} onChange={(event) => updateDraft('readTime', event.target.value)} />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">썸네일 스타일</span>
                    <Select
                      value={draft.thumbnailStyle}
                      onChange={(event) =>
                        updateDraft('thumbnailStyle', event.target.value as BlogPost['imageStyle'])
                      }
                    >
                      {thumbnailOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">태그</span>
                  <Input
                    value={tagText}
                    onChange={(event) => {
                      setTagText(event.target.value);
                      updateDraft('tags', parseTags(event.target.value));
                    }}
                    placeholder="쉼표로 구분해 입력"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">본문 마크다운</span>
                  <Textarea
                    className="min-h-[460px] font-mono leading-6"
                    value={draft.contentMarkdown}
                    onChange={(event) => updateDraft('contentMarkdown', event.target.value)}
                  />
                </label>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[24px] p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-600">Recommendation</p>
                  <h3 className="font-black text-gray-950">추천 정보</h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-gray-600">
                <p>
                  추천 카테고리:{' '}
                  <strong className="text-gray-950">
                    {recommendedCategorySlug || '생성 후 표시됩니다'}
                  </strong>
                </p>
                <p>
                  현재 선택:{' '}
                  <strong className="text-gray-950">{selectedCategory?.name ?? '선택 안 됨'}</strong>
                </p>
              </div>
            </Card>

            <Card className="rounded-[24px] p-6">
              <p className="text-sm font-bold text-primary">Next Study</p>
              <h3 className="mt-1 font-black text-gray-950">추가로 학습하면 좋은 항목</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {recommendedTopics.length > 0 ? (
                  recommendedTopics.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-700"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted">AI 글 생성 후 추천 학습 항목이 표시됩니다.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function createSlug(title: string, fallback: string) {
  const source = `${title} ${fallback}`;
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || `ai-post-${Date.now()}`;
}
