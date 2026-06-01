import { useCallback, useEffect, useState } from 'react';

import { getPublicMenus, MENUS_CHANGED_EVENT } from '../api/menus';
import { publicNavItems } from '../data/siteData';
import type { PublicNavItem } from '../types';

export function usePublicMenus() {
  const [menus, setMenus] = useState<PublicNavItem[]>(publicNavItems);

  const loadMenus = useCallback(async () => {
    try {
      const nextMenus = await getPublicMenus();
      setMenus(nextMenus.length > 0 ? nextMenus : publicNavItems);
    } catch {
      setMenus(publicNavItems);
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

  return menus;
}
