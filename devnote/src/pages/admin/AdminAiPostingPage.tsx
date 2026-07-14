import {
  BookOpenCheck,
  Bot,
  CheckCircle2,
  Clock3,
  Eye,
  Lightbulb,
  Loader2,
  PencilLine,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateAiPost } from '../../api/aiPosts';
import {
  createAiPostingTopic,
  disableAiPostingTopic,
  getAiPostingDraft,
  getAiPostingRuns,
  getAiPostingStatus,
  getAiPostingTopics,
  publishAiPostingDraft,
  runAiPostingNow,
  updateAiPostingTopic,
} from '../../api/aiAutoPosting';
import { getAdminCategories } from '../../api/categories';
import { createPost } from '../../api/posts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import {
  createNormalizedPostRequest,
  createSlug,
  initialDraft,
  isPostRequestComplete,
  parseTags,
  thumbnailOptions,
} from '../../features/aiPosting/aiPostingDraft';
import { useFeedback } from '../../features/feedback/FeedbackContext';
import { PostMarkdownRenderer } from '../../features/post/PostMarkdownRenderer';
import type {
  AdminCategoryRow,
  AiPostDraftDetail,
  AiPostingHistoryItem,
  AiPostingStatus,
  AiPostingTopic,
  BlogPost,
  PostCreateRequest,
} from '../../types';

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
  const [autoStatus, setAutoStatus] = useState<AiPostingStatus | null>(null);
  const [autoTopics, setAutoTopics] = useState<AiPostingTopic[]>([]);
  const [autoRuns, setAutoRuns] = useState<AiPostingHistoryItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicCategoryId, setNewTopicCategoryId] = useState(0);
  const [isManagingAutomation, setIsManagingAutomation] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function loadAutomation() {
      try {
        const [status, topics, runs] = await loadAutomationData();
        if (!cancelled) {
          setAutoStatus(status);
          setAutoTopics(topics);
          setAutoRuns(runs);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : '자동 포스팅 정보를 불러오지 못했습니다.');
        }
      }
    }

    void loadAutomation();
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
      const response = await generateAiPost({
        topic: trimmedTopic,
        direction: direction.trim(),
        keywords: parseTags(keywords),
        excludedKeywords: parseTags(excludedKeywords),
        level,
        lengthHint,
      });
      const generated = response.result;
      const recommendedCategory = categories.find(
        (category) => category.slug === generated.recommendedCategorySlug,
      );
      const fallbackCategory = categories[0];
      const nextCategoryId = recommendedCategory?.id ?? fallbackCategory?.id ?? 0;

      setDraft({
        slug: createSlug(generated.title, trimmedTopic),
        categoryId: nextCategoryId,
        title: generated.title,
        excerpt: generated.summary,
        readTime: generated.readTime,
        thumbnailStyle: generated.thumbnailStyle,
        contentMarkdown: generated.content,
        tags: generated.tags,
      });
      setActiveDraftId(response.draftId);
      setTagText(generated.tags.join(', '));
      setRecommendedTopics(generated.recommendedTopics);
      setRecommendedCategorySlug(generated.recommendedCategorySlug);
      await refreshAutomation();
      showMessage({
        tone: 'success',
        title: 'AI 글 초안을 생성했습니다.',
        description: '제목, 본문, 태그, 카테고리를 확인한 뒤 저장할 수 있습니다.',
      });
    } catch (error) {
      const description =
        error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'AUTH_REQUIRED')
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
    const request = createNormalizedPostRequest(draft, tagText);

    if (!isPostRequestComplete(request)) {
      showSaveValidationError('제목, 요약, 본문, slug, 카테고리는 반드시 입력해야 합니다.');
      return;
    }

    if (request.tags.length === 0) {
      showSaveValidationError('태그를 하나 이상 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedPost = activeDraftId
        ? await publishAiPostingDraft(activeDraftId, request)
        : await createPost(request);
      setActiveDraftId(null);
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
          : error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'AUTH_REQUIRED')
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

  function showSaveValidationError(description: string) {
    setErrorMessage(description);
    showMessage({
      tone: 'warning',
      title: '게시글 저장 정보를 확인해 주세요.',
      description,
    });
  }

  function updateDraft<K extends keyof PostCreateRequest>(key: K, value: PostCreateRequest[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function refreshAutomation() {
    const [status, topics, runs] = await loadAutomationData();
    setAutoStatus(status);
    setAutoTopics(topics);
    setAutoRuns(runs);
  }

  async function handleLoadDraft(id: number) {
    setErrorMessage(null);
    try {
      const savedDraft = await getAiPostingDraft(id);
      applySavedDraft(savedDraft);
      setActiveDraftId(savedDraft.id);
      setIsPreviewMode(false);
      showMessage({
        tone: 'success',
        title: '임시저장 글을 불러왔습니다.',
        description: '내용을 확인하고 편집한 뒤 게시할 수 있습니다.',
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : '임시저장 글을 불러오지 못했습니다.';
      setErrorMessage(description);
      await refreshAutomation();
    }
  }

  function applySavedDraft(savedDraft: AiPostDraftDetail) {
    const recommendedCategory = categories.find(
      (category) => category.slug === savedDraft.recommendedCategorySlug,
    );
    const fallbackCategory = categories[0];
    setTopic(savedDraft.topic);
    setDraft({
      slug: createSlug(savedDraft.title, savedDraft.topic),
      categoryId: recommendedCategory?.id ?? fallbackCategory?.id ?? 0,
      title: savedDraft.title,
      excerpt: savedDraft.summary,
      readTime: savedDraft.readTime,
      thumbnailStyle: savedDraft.thumbnailStyle,
      contentMarkdown: savedDraft.content,
      tags: savedDraft.tags,
    });
    setTagText(savedDraft.tags.join(', '));
    setRecommendedTopics(savedDraft.recommendedTopics);
    setRecommendedCategorySlug(savedDraft.recommendedCategorySlug);
  }

  async function handleAddTopic() {
    if (!newTopicName.trim() || !newTopicCategoryId) {
      setErrorMessage('주제명과 기본 카테고리를 선택해 주세요.');
      return;
    }
    setIsManagingAutomation(true);
    try {
      await createAiPostingTopic({
        name: newTopicName.trim(),
        categoryId: newTopicCategoryId,
        enabled: true,
      });
      setNewTopicName('');
      await refreshAutomation();
    } finally {
      setIsManagingAutomation(false);
    }
  }

  async function handleSaveTopic(topic: AiPostingTopic) {
    setIsManagingAutomation(true);
    try {
      await updateAiPostingTopic(topic);
      await refreshAutomation();
    } finally {
      setIsManagingAutomation(false);
    }
  }

  async function handleDisableTopic(id: number) {
    setIsManagingAutomation(true);
    try {
      await disableAiPostingTopic(id);
      await refreshAutomation();
    } finally {
      setIsManagingAutomation(false);
    }
  }

  async function handleRunNow() {
    const accepted = window.confirm('다음 주제로 게시글을 즉시 생성하고 게시할까요?');
    if (!accepted) return;
    setIsManagingAutomation(true);
    try {
      const run = await runAiPostingNow();
      showMessage({
        tone: run.status === 'SUCCEEDED' ? 'success' : 'error',
        title: run.status === 'SUCCEEDED' ? '자동 게시를 완료했습니다.' : '자동 게시가 완료되지 않았습니다.',
        description: run.generatedTitle ?? run.errorMessage ?? undefined,
      });
      await refreshAutomation();
    } finally {
      setIsManagingAutomation(false);
    }
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
              Google AI Studio의 Gemini API로 초안을 만들고, 등록한 개발 주제를 순환해
              매일 오전 6시에 게시글을 자동 발행합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            API Key는 서버 환경변수로 관리
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[24px] p-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Daily Publishing</p>
                <h3 className="text-xl font-black text-gray-950">매일 오전 6시 자동 게시</h3>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={isManagingAutomation || !autoStatus?.geminiConfigured}
              onClick={() => void handleRunNow()}
            >
              {isManagingAutomation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              지금 실행
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <AutomationStat
              label="Gemini API"
              value={autoStatus?.geminiConfigured ? '연결됨' : '환경변수 필요'}
              active={Boolean(autoStatus?.geminiConfigured)}
            />
            <AutomationStat
              label="예약 실행"
              value={autoStatus?.enabled ? '활성화' : '비활성화'}
              active={Boolean(autoStatus?.enabled)}
            />
            <AutomationStat
              label="다음 주제"
              value={autoStatus?.nextTopic?.name ?? '등록된 주제 없음'}
              active={Boolean(autoStatus?.nextTopic)}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-gray-50 p-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              다음 실행 {autoStatus ? formatDateTime(autoStatus.nextRunAt) : '-'}
            </span>
            <span>{autoStatus?.model ?? 'Gemini 모델 확인 중'}</span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Input
              value={newTopicName}
              onChange={(event) => setNewTopicName(event.target.value)}
              placeholder="새 개발 주제 예: Spring Boot"
            />
            <Select
              value={newTopicCategoryId || ''}
              onChange={(event) => setNewTopicCategoryId(Number(event.target.value))}
            >
              <option value="">기본 카테고리</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
            <Button type="button" variant="outline" className="gap-2" onClick={() => void handleAddTopic()}>
              <Plus className="h-4 w-4" />
              주제 추가
            </Button>
          </div>

          <div className="mt-4 divide-y divide-line border-y border-line">
            {autoTopics.length > 0 ? autoTopics.map((item, index) => (
              <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[40px_minmax(0,1fr)_180px_auto] md:items-center">
                <span className="text-sm font-black text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                <Input
                  value={item.name}
                  onBlur={() => void handleSaveTopic(item)}
                  onChange={(event) => setAutoTopics((current) => current.map((topicItem) =>
                    topicItem.id === item.id ? { ...topicItem, name: event.target.value } : topicItem
                  ))}
                />
                <Select
                  value={item.categoryId}
                  onChange={(event) => {
                    const nextCategoryId = Number(event.target.value);
                    const nextTopic = {
                      ...item,
                      categoryId: nextCategoryId,
                      categoryName: categories.find((category) => category.id === nextCategoryId)?.name ?? '',
                    };
                    setAutoTopics((current) => current.map((topicItem) =>
                      topicItem.id === item.id ? nextTopic : topicItem
                    ));
                    void handleSaveTopic(nextTopic);
                  }}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
                <div className="flex items-center justify-end gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => {
                        const nextTopic = { ...item, enabled: event.target.checked };
                        setAutoTopics((current) => current.map((topicItem) =>
                          topicItem.id === item.id ? nextTopic : topicItem
                        ));
                        void handleSaveTopic(nextTopic);
                      }}
                    />
                    사용
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    title="주제 비활성화"
                    onClick={() => void handleDisableTopic(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )) : (
              <p className="py-8 text-center text-sm text-muted">순환할 개발 주제를 추가해 주세요.</p>
            )}
          </div>
        </Card>

        <Card className="rounded-[24px] p-6">
          <p className="text-sm font-bold text-gray-500">Run History</p>
          <h3 className="mt-1 text-xl font-black text-gray-950">최근 자동 게시</h3>
          <div className="mt-5 divide-y divide-line">
            {autoRuns.length > 0 ? autoRuns.slice(0, 8).map((run) => (
              <div key={run.key} className="py-4">
                <div className="flex items-start gap-3">
                  {run.status === 'SUCCEEDED'
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />}
                  <div className="min-w-0">
                    <button
                      type="button"
                      disabled={!run.loadable || run.draftId === null}
                      className="block max-w-full truncate text-left text-sm font-bold text-gray-900 enabled:hover:text-primary enabled:hover:underline disabled:cursor-default"
                      onClick={() => run.draftId !== null && void handleLoadDraft(run.draftId)}
                    >
                      {run.topic}
                    </button>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(run.occurredAt)}</p>
                    {run.errorMessage ? <p className="mt-2 text-xs leading-5 text-red-600">{run.errorMessage}</p> : null}
                  </div>
                </div>
              </div>
            )) : <p className="py-8 text-sm text-muted">아직 실행 이력이 없습니다.</p>}
          </div>
        </Card>
      </section>

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
              <article
                aria-label="생성 결과 미리보기"
                tabIndex={0}
                className="mt-6 max-h-[65vh] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-5 pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:p-7 md:pr-4 xl:max-h-[720px]"
              >
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

function AutomationStat({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="text-xs font-bold text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${active ? 'text-gray-950' : 'text-amber-700'}`}>{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function loadAutomationData() {
  return Promise.all([
    getAiPostingStatus(),
    getAiPostingTopics(),
    getAiPostingRuns(),
  ]);
}
