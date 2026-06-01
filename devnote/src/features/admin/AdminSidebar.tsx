import {
  Bot,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListTree,
  MessageCircle,
  Settings,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getAdminSidebarMenus, MENUS_CHANGED_EVENT } from '../../api/menus';
import type { PublicNavItem } from '../../types';

const fallbackAdminNavItems = [
  { label: '대시보드', to: '/admin', icon: LayoutDashboard, end: true },
  { label: '게시글 관리', to: '/posts', icon: FileText, end: false },
  { label: '카테고리 관리', to: '/admin/categories', icon: FolderKanban, end: false },
  { label: '메뉴 관리', to: '/admin/menus', icon: ListTree, end: false },
  { label: '댓글 관리', to: '/posts/spring-boot', icon: MessageCircle, end: false },
  { label: '사용자 관리', to: '/login', icon: UserRound, end: false },
  { label: 'AI 자동 포스팅', to: '/admin/ai-posting', icon: Bot, end: false },
  { label: '설정', to: '/login', icon: Settings, end: false },
];

const adminIconByPath = [
  { match: '/admin/ai-posting', icon: Bot },
  { match: '/admin/categories', icon: FolderKanban },
  { match: '/admin/menus', icon: ListTree },
  { match: '/posts', icon: FileText },
  { match: '/login', icon: UserRound },
  { match: '/admin', icon: LayoutDashboard },
] as const;

function resolveAdminIcon(path: string) {
  return adminIconByPath.find((entry) => path.startsWith(entry.match))?.icon ?? Settings;
}

function mapMenuToNavItem(menu: PublicNavItem) {
  return {
    label: menu.label,
    to: menu.to,
    icon: resolveAdminIcon(menu.to),
    end: menu.end ?? false,
  };
}

export function AdminSidebar() {
  const [navItems, setNavItems] = useState(fallbackAdminNavItems);

  const loadMenus = useCallback(async () => {
    try {
      const menus = await getAdminSidebarMenus();
      setNavItems(menus.length > 0 ? menus.map(mapMenuToNavItem) : fallbackAdminNavItems);
    } catch {
      setNavItems(fallbackAdminNavItems);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMenus();
    });

    window.addEventListener(MENUS_CHANGED_EVENT, loadMenus);

    return () => {
      window.removeEventListener(MENUS_CHANGED_EVENT, loadMenus);
    };
  }, [loadMenus]);

  return (
    <aside className="hidden w-[255px] shrink-0 border-r border-line bg-white md:flex md:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-line px-7">
        <span className="text-2xl font-black tracking-tight text-gray-950">DevNote</span>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary-soft text-primary shadow-[0_12px_28px_rgba(109,93,252,0.1)]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-[22px] border border-line bg-[#fbfbff] p-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-black text-primary">
            A
          </div>
          <div>
            <p className="font-bold text-gray-950">Admin</p>
            <p className="text-xs text-muted">admin@devnote.dev</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
