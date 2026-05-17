import { Eye, FileText, MessageSquare, ThumbsUp, UserPlus } from 'lucide-react';
import type {
  ActivityItem,
  AdminCategoryRow,
  AdminMenuRow,
  AdminStat,
  BlogCategory,
  BlogPost,
  LoginProvider,
  ProjectPreview,
  PublicNavItem,
  RankedPost,
  StackItem,
  TrafficPoint,
} from '../types';

export const publicNavItems: PublicNavItem[] = [
  { label: '홈', to: '/', end: true },
  { label: '블로그', to: '/posts' },
  { label: '프로젝트', to: '/posts/devops' },
  { label: '기술 스택', to: '/posts/spring-boot' },
  { label: '소개', to: '/' },
  { label: '문의', to: '/' },
];

export const blogCategories: BlogCategory[] = [
  { slug: 'all', name: '전체', count: 42 },
  { slug: 'spring-boot', name: 'Spring Boot', count: 12 },
  { slug: 'ai-automation', name: 'AI 자동화', count: 9 },
  { slug: 'devops', name: 'DevOps', count: 6 },
  { slug: 'java', name: 'Java', count: 5 },
  { slug: 'database', name: 'Database', count: 4 },
  { slug: 'infra', name: '인프라', count: 3 },
  { slug: 'etc', name: '기타', count: 3 },
];

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'ai-auto-posting-system',
    category: 'AI 자동화',
    categorySlug: 'ai-automation',
    title: 'AI 자동 포스팅 시스템 구축기',
    excerpt: 'ChatGPT API와 스케줄러를 활용해 블로그 글을 자동 생성하고 배포하는 흐름을 정리했습니다.',
    date: '2024.05.18',
    readTime: '7분 읽기',
    views: '2.3K',
    tags: ['AI 자동화', 'ChatGPT', 'Spring Boot', 'Scheduler'],
    imageStyle: 'ai',
  },
  {
    id: 2,
    slug: 'spring-boot-exception-handling',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Spring Boot 3.x에서 예외 처리 정리',
    excerpt: '@ControllerAdvice를 이용해 공통 예외 처리와 응답 포맷을 설계하는 방법을 다룹니다.',
    date: '2024.05.20',
    readTime: '5분 읽기',
    views: '1.2K',
    tags: ['Spring Boot', 'Java', 'Exception', 'API'],
    imageStyle: 'laptop',
  },
  {
    id: 3,
    slug: 'docker-dev-environment',
    category: 'DevOps',
    categorySlug: 'devops',
    title: 'Docker로 개발 환경 구축하기',
    excerpt: '컨테이너 기반으로 개발 환경을 통일하고 배포 흐름까지 연결하는 과정을 정리했습니다.',
    date: '2024.05.15',
    readTime: '6분 읽기',
    views: '1.6K',
    tags: ['Docker', 'DevOps', 'Container', 'Infra'],
    imageStyle: 'docker',
  },
  {
    id: 4,
    slug: 'java-17-whats-new',
    category: 'Java',
    categorySlug: 'java',
    title: 'Java 17 핵심 기능 요약',
    excerpt: '실무에서 바로 체감할 수 있는 Java 17의 주요 기능과 변경점을 정리했습니다.',
    date: '2024.05.12',
    readTime: '4분 읽기',
    views: '1.1K',
    tags: ['Java 17', 'Language', 'Backend', 'JVM'],
    imageStyle: 'code',
  },
  {
    id: 5,
    slug: 'spring-data-jpa-guide',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Spring Data JPA 실전 가이드',
    excerpt: '엔티티 설계부터 성능 최적화 포인트까지 JPA 실무 감각으로 정리했습니다.',
    date: '2024.05.17',
    readTime: '6분 읽기',
    views: '1.4K',
    tags: ['Spring Data JPA', 'ORM', 'Database', 'Performance'],
    imageStyle: 'data',
  },
];

export const allBlogPosts: BlogPost[] = [
  ...blogPosts,
  {
    id: 6,
    slug: 'database-crawling-automation',
    category: 'AI 자동화',
    categorySlug: 'ai-automation',
    title: '데이터 수집 파이프라인 자동화',
    excerpt: 'Spring Boot와 Jsoup을 사용해 반복적인 수집 작업을 자동화한 구조를 소개합니다.',
    date: '2024.05.10',
    readTime: '6분 읽기',
    views: '823',
    tags: ['Crawler', 'Automation', 'Spring Boot', 'Jsoup'],
    imageStyle: 'chart',
  },
  {
    id: 7,
    slug: 'spring-security-jwt',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Spring Security JWT 적용하기',
    excerpt: 'JWT 인증 흐름을 Spring Security와 함께 구성하는 방법을 단계별로 정리했습니다.',
    date: '2024.05.14',
    readTime: '8분 읽기',
    views: '1.8K',
    tags: ['Spring Security', 'JWT', 'Auth', 'Backend'],
    imageStyle: 'security',
  },
  {
    id: 8,
    slug: 'spring-boot-oauth2-login',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Spring Boot와 OAuth2 로그인 연동',
    excerpt: 'Google과 GitHub 로그인을 연동하고 사용자 정보를 다루는 흐름을 정리했습니다.',
    date: '2024.05.11',
    readTime: '7분 읽기',
    views: '1.0K',
    tags: ['OAuth2', 'Spring Boot', 'Login', 'Security'],
    imageStyle: 'ai',
  },
  {
    id: 9,
    slug: 'spring-boot-actuator-monitoring',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Spring Boot Actuator 모니터링',
    excerpt: 'Actuator와 운영 지표를 연결해 서비스 상태를 추적하는 방법을 다룹니다.',
    date: '2024.05.08',
    readTime: '5분 읽기',
    views: '764',
    tags: ['Actuator', 'Monitoring', 'Ops', 'Spring Boot'],
    imageStyle: 'monitor',
  },
];

export function getPostPath(post: Pick<BlogPost, 'categorySlug' | 'slug'>) {
  return `/posts/${post.categorySlug}/${post.slug}`;
}

export const popularPosts: RankedPost[] = [
  { rank: 1, title: 'AI 자동 포스팅 시스템 구축기', views: '2.3K' },
  { rank: 2, title: 'Spring Security JWT 적용하기', views: '1.8K' },
  { rank: 3, title: 'Docker로 개발 환경 구축하기', views: '1.6K' },
  { rank: 4, title: 'Spring Data JPA 실전 가이드', views: '1.4K' },
  { rank: 5, title: 'Spring Boot 3.x에서 예외 처리 정리', views: '1.2K' },
];

export const categoryPopularPosts: Record<string, RankedPost[]> = {
  'spring-boot': [
    { rank: 1, title: 'Spring Security JWT 적용하기', views: '1.8K' },
    { rank: 2, title: 'Spring Data JPA 실전 가이드', views: '1.4K' },
    { rank: 3, title: 'Spring Boot 3.x에서 예외 처리 정리', views: '1.2K' },
    { rank: 4, title: 'Spring Boot와 OAuth2 로그인 연동', views: '1.0K' },
    { rank: 5, title: 'Spring Boot Actuator 모니터링', views: '764' },
  ],
  'ai-automation': [
    { rank: 1, title: 'AI 자동 포스팅 시스템 구축기', views: '2.3K' },
    { rank: 2, title: '데이터 수집 파이프라인 자동화', views: '823' },
    { rank: 3, title: 'ChatGPT API 활용 사례 10가지', views: '720' },
    { rank: 4, title: '프로젝트 템플릿 자동 생성', views: '648' },
    { rank: 5, title: '배치 파이프라인 운영 팁', views: '532' },
  ],
};

export const loginProviders: LoginProvider[] = [
  { id: 'github', label: 'GitHub로 로그인', icon: 'github' },
  { id: 'google', label: 'Google로 로그인', icon: 'chrome' },
  { id: 'email', label: '이메일로 회원가입', icon: 'mail' },
];

export const featuredProjects: ProjectPreview[] = [
  {
    id: 1,
    title: 'AI Blog Auto Poster',
    description: 'AI를 활용해 블로그 글을 자동 생성하고 배포하는 시스템',
    period: '2024.03 ~ 진행 중',
    tags: ['Spring Boot', 'OpenAI API', 'Scheduler'],
    accent: 'violet',
    icon: 'zap',
  },
  {
    id: 2,
    title: 'Dev Dashboard',
    description: '개발 데이터를 시각화해 보여주는 대시보드 플랫폼',
    period: '2024.01 ~ 2024.03',
    tags: ['React', 'TypeScript', 'Recharts'],
    accent: 'indigo',
    icon: 'chart',
  },
  {
    id: 3,
    title: 'Auth Server',
    description: 'JWT 기반 인증과 권한 관리를 제공하는 마이크로서비스',
    period: '2023.11 ~ 2024.01',
    tags: ['Spring Security', 'JWT', 'Redis'],
    accent: 'green',
    icon: 'lock',
  },
];

export const stackItems: StackItem[] = [
  { name: 'Java', symbol: 'J' },
  { name: 'Spring Boot', symbol: 'SB' },
  { name: 'MySQL', symbol: 'DB' },
  { name: 'Redis', symbol: 'RD' },
  { name: 'Docker', symbol: 'DK' },
  { name: 'Kubernetes', symbol: 'K8' },
  { name: 'React', symbol: 'R' },
  { name: 'TypeScript', symbol: 'TS' },
  { name: 'OpenAI', symbol: 'AI' },
  { name: 'GitHub Actions', symbol: 'GH' },
];

export const adminStats: AdminStat[] = [
  { label: '총 게시글', value: '156', change: '12', tone: 'violet', icon: FileText },
  { label: '총 조회수', value: '12,548', change: '24.5%', tone: 'green', icon: Eye },
  { label: '좋아요 수', value: '1,248', change: '15.2%', tone: 'blue', icon: ThumbsUp },
  { label: '댓글 수', value: '328', change: '8.1%', tone: 'orange', icon: MessageSquare },
  { label: '신규 구독자', value: '342', change: '18.7%', tone: 'pink', icon: UserPlus },
];

export const trafficPoints: TrafficPoint[] = [
  { label: '05/12', value: 800 },
  { label: '05/13', value: 1600 },
  { label: '05/14', value: 1950 },
  { label: '05/15', value: 2100 },
  { label: '05/16', value: 1750 },
  { label: '05/17', value: 2350 },
  { label: '05/18', value: 2050 },
];

export const recentActivities: ActivityItem[] = [
  { id: 1, title: '새 게시글이 등록되었습니다', description: 'Spring Data JPA 실전 가이드', timeAgo: '5분 전', tone: 'blue' },
  { id: 2, title: '게시글이 수정되었습니다', description: 'Spring Security JWT 적용하기', timeAgo: '1시간 전', tone: 'green' },
  { id: 3, title: '새 댓글이 등록되었습니다', description: 'AI 자동 포스팅 시스템 구축기', timeAgo: '2시간 전', tone: 'orange' },
  { id: 4, title: '신규 구독자가 추가되었습니다', description: 'user@example.com', timeAgo: '3시간 전', tone: 'violet' },
];

export const adminTopPosts: RankedPost[] = [
  { rank: 1, title: 'AI 자동 포스팅 시스템 구축기', views: '2.3K' },
  { rank: 2, title: 'Spring Security JWT 적용하기', views: '1.8K' },
  { rank: 3, title: 'Docker로 개발 환경 구축하기', views: '1.6K' },
  { rank: 4, title: 'Spring Data JPA 실전 가이드', views: '1.4K' },
  { rank: 5, title: 'Spring Boot 3.x에서 예외 처리 정리', views: '1.2K' },
];

export const adminMenuRows: AdminMenuRow[] = [
  { id: 1, name: '홈', path: '/', state: '-', visible: true, order: 1 },
  { id: 2, name: '블로그', path: '/posts', state: '-', visible: true, order: 2 },
  { id: 3, name: '프로젝트', path: '/projects', state: '-', visible: true, order: 3 },
  { id: 4, name: 'AI 자동 포스팅', path: '/admin/ai-posting', state: '-', visible: true, order: 4 },
  { id: 5, name: '기술 스택', path: '/stack', state: '-', visible: false, order: 5 },
  { id: 6, name: '소개', path: '/about', state: '-', visible: false, order: 6 },
  { id: 7, name: '문의', path: '/contact', state: '-', visible: false, order: 7 },
];

export const adminCategoryRows: AdminCategoryRow[] = [
  { id: 1, name: 'Spring Boot', description: 'Spring Boot 관련 개발 팁과 아키텍처', postCount: 24, visible: true, order: 1 },
  { id: 2, name: 'AI 자동화', description: 'AI와 자동화 도구 활용 방법', postCount: 18, visible: true, order: 2 },
  { id: 3, name: 'DevOps', description: '배포, CI/CD, 인프라 운영 노하우', postCount: 16, visible: true, order: 3 },
  { id: 4, name: 'Java', description: 'Java 언어와 백엔드 개발 정리', postCount: 14, visible: true, order: 4 },
  { id: 5, name: 'Database', description: '데이터베이스 설계와 운영', postCount: 12, visible: true, order: 5 },
  { id: 6, name: '프로그래밍 일반', description: '개발 경험과 학습 메모', postCount: 8, visible: false, order: 6 },
  { id: 7, name: '기타', description: '기타 주제', postCount: 6, visible: false, order: 7 },
];
