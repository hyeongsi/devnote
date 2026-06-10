import { Menu, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT, getCurrentUser, logout } from '../../api/auth';
import { isSearchShortcut } from '../../features/searchCommands';
import { usePublicMenus } from '../../hooks/usePublicMenus';
import type { AuthUser } from '../../types';
import { PostSearchDialog } from './PostSearchDialog';

export function Header() {
  const navigate = useNavigate();
  const publicNavItems = usePublicMenus();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    try {
      setCurrentUser(await getCurrentUser());
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCurrentUser();
    });

    window.addEventListener(AUTH_CHANGED_EVENT, loadCurrentUser);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, loadCurrentUser);
    };
  }, [loadCurrentUser]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) {
        return;
      }

      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setCurrentUser(null);
      navigate('/');
    } catch {
      setCurrentUser(null);
    }
  }, [navigate]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-8 xl:px-12">
        <NavLink to="/" className="text-2xl font-black text-gray-950">
          DevNote
        </NavLink>

        <nav className="hidden items-center gap-9 text-sm font-semibold text-gray-700 lg:flex">
          {publicNavItems.map((item) => (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'text-primary' : 'transition hover:text-primary')}
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
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
          {currentUser ? (
            <button
              type="button"
              className="hidden text-sm font-semibold text-gray-500 transition hover:text-primary md:inline"
              onClick={() => void handleLogout()}
            >
              로그아웃
            </button>
          ) : null}
          <button type="button" aria-label="메뉴" className="rounded-full p-2.5 text-gray-700 lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      {searchOpen ? <PostSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </header>
  );
}
