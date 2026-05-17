import { Bell, CalendarDays } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../../features/admin/AdminSidebar';

const pageTitles = [
  { prefix: '/admin/ai-posting', title: 'AI 자동 포스팅' },
  { prefix: '/admin/categories', title: '카테고리 관리' },
  { prefix: '/admin/menus', title: '메뉴 관리' },
  { prefix: '/admin', title: '대시보드' },
];

export function AdminShell() {
  const location = useLocation();
  const currentTitle =
    pageTitles.find((item) => location.pathname.startsWith(item.prefix))?.title ?? '관리';

  return (
    <div className="app-shell flex">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-20 items-center justify-between border-b border-line px-6 md:px-10">
          <div>
            <p className="text-sm font-semibold text-primary">DevNote Admin</p>
            <h1 className="text-2xl font-black tracking-tight text-gray-950">{currentTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-full p-2.5 text-gray-700 transition hover:bg-primary-soft hover:text-primary"
              aria-label="알림"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                3
              </span>
            </button>
            <div className="hidden items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-gray-700 md:flex">
              <CalendarDays className="h-4 w-4 text-primary" />
              2024.05.12 ~ 2024.05.18
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-black text-primary">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#fbfbff] px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
