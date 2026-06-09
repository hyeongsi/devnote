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
}

export interface AiPostGenerateResponse {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  readTime: string;
  recommendedTopics: string[];
  recommendedCategorySlug: string;
  thumbnailStyle: BlogPost['imageStyle'];
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

export interface ProjectPreview {
  id: number;
  title: string;
  description: string;
  period: string;
  tags: string[];
  accent: 'violet' | 'indigo' | 'green';
  icon: 'zap' | 'chart' | 'lock';
}

export interface StackItem {
  name: string;
  symbol: string;
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
