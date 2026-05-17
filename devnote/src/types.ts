import type { LucideIcon } from 'lucide-react';

export interface PublicNavItem {
  label: string;
  to: string;
  end?: boolean;
}

export interface BlogCategory {
  slug: string;
  name: string;
  count: number;
}

export interface BlogPost {
  id: number;
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  views: string;
  tags: string[];
  imageStyle: 'ai' | 'laptop' | 'docker' | 'code' | 'chart' | 'security' | 'data' | 'monitor';
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
  id: number;
  name: string;
  path: string;
  state: string;
  visible: boolean;
  order: number;
}

export interface AdminCategoryRow {
  id: number;
  name: string;
  description: string;
  postCount: number;
  visible: boolean;
  order: number;
}
