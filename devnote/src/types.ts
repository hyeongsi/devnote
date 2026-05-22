import type { LucideIcon } from 'lucide-react';

export interface PublicNavItem {
  label: string;
  to: string;
  end?: boolean;
}

export type MenuArea = 'ADMIN' | 'HEADER' | 'ROOT';

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
}

export interface LoginProvider {
  id: string;
  label: string;
  icon: 'github' | 'chrome' | 'mail';
}

export interface AdminStat {
  label: string;
  value: string;
  change: string;
  tone: 'violet' | 'green' | 'blue' | 'orange' | 'pink';
  icon: LucideIcon;
}

export interface TrafficPoint {
  label: string;
  value: number;
}

export interface ActivityItem {
  id: number;
  title: string;
  description: string;
  timeAgo: string;
  tone: 'blue' | 'green' | 'orange' | 'violet';
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
