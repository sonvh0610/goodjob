import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppIcon } from '../../ui/AppIcon';

const COLLAPSE_KEY = 'app_shell_sidebar_collapsed';

export function GlobalShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(COLLAPSE_KEY);
    setCollapsed(raw === '1');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const activeKey = useMemo(() => {
    if (location.pathname === '/admin') return 'admin';
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname === '/feed') return 'feed';
    if (location.pathname === '/send-kudos') return 'send';
    if (location.pathname === '/rewards') return 'rewards';
    if (location.pathname === '/wallet') return 'wallet';
    if (location.pathname === '/notifications') return 'notifications';
    return null;
  }, [location.pathname]);

  const desktopMainPadding = collapsed ? 'lg:pl-20' : 'lg:pl-64';

  return (
    <div className="min-h-screen bg-white">
      <AppSidebar
        activeKey={activeKey}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleDesktopSidebar={() => setCollapsed((prev) => !prev)}
      />
      <button
        aria-label="Open menu"
        className="lg:hidden fixed top-4 left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <AppIcon>menu</AppIcon>
      </button>

      <main className={`pt-16 lg:pt-0 ${desktopMainPadding}`}>
        <Outlet />
      </main>
    </div>
  );
}
