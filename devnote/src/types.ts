import type { LucideIcon } from 'lucide-react';

export interface PublicNavItem {
  label: string;
  to: string;
  end?: boolean;
}

export type MenuArea = 'ADMIN' | 'HEADER' | 'ROOT' | '';

export interface BlogCategory {
  id?: number;
  slug: string;
  name: string;
  description?: string;
  count: number;
  visible?: boolean;
  displayOrder?: number;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  role: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  displayDate: string;
  readTime: string;
  viewCount: number;
  tags: string[];
  imageStyle: 'ai' | 'laptop' | 'docker' | 'code' | 'chart' | 'security' | 'data' | 'monitor';
}

export interface BlogPostApiResponse {
  id: number;
  slug: string;
  categoryName: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  displayDate: string;
  readTime: string;
  viewCount: number;
  tags: string[];
  thumbnailStyle: BlogPost['imageStyle'];
}

export interface BlogCategoryApiResponse {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
  visible: boolean;
  displayOrder: number;
}

export interface BlogPostDetailApiResponse extends BlogPostApiResponse {
  contentMarkdown: string;
}

export interface BlogPostDetail extends BlogPost {
  contentMarkdown: string;
}

export interface BlogPostSearchResult {
  id: number;
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  displayDate: string;
  matchedText: string;
}

export interface BlogPostSearchApiResponse {
  id: number;
  slug: string;
  categoryName: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  displayDate: string;
  matchedText: string;
}

export interface AiPostGenerateRequest {
  topic: string;
  direction?: string;
  keywords?: string[];
  excludedKeywords?: string[];
  level?: string;
  lengthHint?: string;
}

export interface AiPostGenerateResult {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  readTime: string;
  recommendedTopics: string[];
  recommendedCategorySlug: string;
  thumbnailStyle: BlogPost['imageStyle'];
}

export interface AiPostGenerateResponse {
  draftId: number;
  result: AiPostGenerateResult;
}

export interface AiPostingTopic {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  enabled: boolean;
  displayOrder: number;
  lastSucceededAt: string | null;
}

export type AiPostingRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

export interface AiPostingRun {
  id: number;
  topicId: number | null;
  topicName: string | null;
  postId: number | null;
  status: AiPostingRunStatus;
  generatedTitle: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AiPostingHistoryItem {
  key: string;
  draftId: number | null;
  topic: string;
  status: AiPostingRunStatus | 'DRAFT' | 'PUBLISHED';
  loadable: boolean;
  occurredAt: string;
  errorMessage: string | null;
}

export interface AiPostDraftDetail {
  id: number;
  topic: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  readTime: string;
  recommendedTopics: string[];
  recommendedCategorySlug: string;
  thumbnailStyle: BlogPost['imageStyle'];
}

export interface AiPostingStatus {
  enabled: boolean;
  geminiConfigured: boolean;
  model: string;
  zone: string;
  cron: string;
  nextRunAt: string;
  nextTopic: AiPostingTopic | null;
}

export interface PostCreateRequest {
  slug: string;
  categoryId: number;
  title: string;
  excerpt: string;
  readTime: string;
  thumbnailStyle: BlogPost['imageStyle'];
  contentMarkdown: string;
  tags: string[];
}

export interface RankedPost {
  rank: number;
  title: string;
  views: string;
  slug: string;
  categorySlug: string;
}

export interface LoginProvider {
  id: string;
  label: string;
  icon: 'github' | 'chrome' | 'mail';
}

export interface AdminStat {
  label: string;
  value: string;
  note: string;
  tone: 'violet' | 'green' | 'blue' | 'orange' | 'pink';
  icon: LucideIcon;
}

export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  newSubscribers: number;
}

export interface DashboardTrafficPoint {
  date: string;
  value: number;
}

export type DashboardActivityType =
  | 'POST_CREATED'
  | 'COMMENT_CREATED'
  | 'POST_LIKED'
  | 'SUBSCRIBER_CREATED';

export interface DashboardActivity {
  id: string;
  type: DashboardActivityType;
  description: string;
  occurredAt: string;
}

export interface ErrorLogSummary {
  id: number;
  occurredAt: string;
  method: string;
  path: string;
  status: number;
  exceptionType: string | null;
  message: string | null;
  durationMs: number;
}

export interface ErrorLogSearchParams {
  keyword?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
}

export interface ErrorLogDetail extends ErrorLogSummary {
  queryString: string | null;
  stackTrace: string | null;
  clientIp: string | null;
  userAgent: string | null;
}

export interface AdminMenuRow {
  id?: number;
  name: string;
  path: string;
  state: string;
  visible: boolean;
  order: number;
  area?: MenuArea;
  parentId?: number | null;
  depth?: number;
}

export interface AdminCategoryRow {
  id?: number;
  slug?: string;
  name: string;
  description: string;
  postCount: number;
  visible: boolean;
  order: number;
}

export interface AdminCategoryApiResponse {
  id: number;
  slug: string;
  name: string;
  description: string;
  postCount: number;
  visible: boolean;
  displayOrder: number;
}

export interface AdminMenuApiResponse {
  id: number;
  name: string;
  path: string;
  state: string;
  visible: boolean;
  displayOrder: number;
  area?: MenuArea;
  parentId?: number | null;
  depth?: number;
}
