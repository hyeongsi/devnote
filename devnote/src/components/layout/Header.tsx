import { Code2, Menu, Moon, Search } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { publicNavItems } from '../../data/siteData';
import { Button } from '../ui/Button';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-8 xl:px-12">
        <NavLink to="/" className="flex items-center gap-3 text-2xl font-black tracking-tight text-gray-950">
          <span className="rounded-2xl bg-primary-soft p-2 text-primary">
            <Code2 className="h-5 w-5" />
          </span>
          DevNote
        </NavLink>

        <nav className="hidden items-center gap-9 text-sm font-semibold text-gray-700 lg:flex">
          {publicNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'text-primary' : 'transition hover:text-primary'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            aria-label="검색"
            className="rounded-full p-2.5 text-gray-700 transition hover:bg-primary-soft hover:text-primary"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="다크 모드"
            className="rounded-full p-2.5 text-gray-700 transition hover:bg-primary-soft hover:text-primary"
          >
            <Moon className="h-5 w-5" />
          </button>
          <Button
            size="sm"
            variant="dark"
            className="hidden md:inline-flex"
            onClick={() => navigate('/login')}
          >
            로그인
          </Button>
          <button type="button" aria-label="메뉴" className="rounded-full p-2.5 text-gray-700 lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
