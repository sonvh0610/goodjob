import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { SidebarNavLink } from '../../navigation/SidebarNavLink';
import { AppIcon } from '../../ui/AppIcon';
import { GoodJobLogo } from '../../ui/GoodJobLogo';
import { NAV_ITEMS, type NavItem } from './shell-nav';

type AppSidebarProps = {
  activeKey: NavItem['key'] | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleDesktopSidebar: () => void;
};

export function AppSidebar({
  activeKey,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleDesktopSidebar,
}: AppSidebarProps) {
  const { logout, user } = useAuth();
  const desktopSidebarWidth = collapsed ? 'lg:w-20' : 'lg:w-64';
  const navItems = user?.role === 'admin' ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.key !== 'admin');
  const profileName = user?.displayName ?? 'Member';
  const profileEmail = user?.email ?? '';
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || 'M';

  const onLogout = async () => {
    await logout();
    onCloseMobile();
  };

  return (
    <>
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen z-40 bg-white border-r border-slate-100 transition-all ${desktopSidebarWidth}`}
      >
        <div className="w-full px-3 py-4 flex h-full flex-col">
          <div
            className={`mb-4 pb-4 border-b border-slate-100 flex ${collapsed ? 'justify-center' : 'px-2 justify-start'}`}
          >
            <Link to="/">
              <GoodJobLogo className={collapsed ? 'h-10 w-10' : 'h-10 w-auto'} compact={collapsed} />
            </Link>
          </div>

          <nav className="flex flex-col gap-2 overflow-y-auto pb-4">
            {navItems.map((item) => (
              <SidebarNavLink
                active={activeKey === item.key}
                collapsed={collapsed}
                iconName={item.icon}
                key={item.key}
                label={item.label}
                to={item.to}
              />
            ))}
          </nav>
          <div className="mt-auto border-t border-slate-100 pt-4">
            <button
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`mb-3 w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors ${collapsed ? 'justify-center' : 'gap-2'}`}
              onClick={onToggleDesktopSidebar}
              type="button"
            >
              <AppIcon>menu</AppIcon>
              {collapsed ? null : <span>Collapse Sidebar</span>}
            </button>
            <div
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}
            >
              {user?.avatarUrl ? (
                <img
                  alt={profileName}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {profileInitial}
                </div>
              )}
              {collapsed ? null : (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
                  <p className="truncate text-xs text-slate-500">{profileEmail}</p>
                </div>
              )}
            </div>
            <button
              className={`mt-3 w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors ${collapsed ? 'justify-center' : 'gap-2'}`}
              onClick={() => void onLogout()}
              type="button"
            >
              <AppIcon>log_out</AppIcon>
              {collapsed ? null : <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={onCloseMobile}
            type="button"
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-slate-100 px-3 py-4">
            <div className="flex h-full flex-col">
              <div className="mb-4 pb-4 border-b border-slate-100 flex items-center justify-between px-2">
                <Link onClick={onCloseMobile} to="/">
                  <GoodJobLogo className="h-10 w-auto" />
                </Link>
                <button
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                  onClick={onCloseMobile}
                  type="button"
                >
                  <AppIcon>close</AppIcon>
                </button>
              </div>
              <nav className="flex flex-col gap-2 overflow-y-auto pb-4">
                {navItems.map((item) => (
                  <SidebarNavLink
                    active={activeKey === item.key}
                    iconName={item.icon}
                    key={item.key}
                    label={item.label}
                    onClick={onCloseMobile}
                    to={item.to}
                  />
                ))}
              </nav>
              <div className="mt-auto border-t border-slate-100 pt-4">
                <button
                  aria-label="Close menu"
                  className="mb-3 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={onCloseMobile}
                  type="button"
                >
                  <AppIcon>menu</AppIcon>
                  <span>Close Menu</span>
                </button>
                <div className="flex items-center gap-3 px-2">
                  {user?.avatarUrl ? (
                    <img
                      alt={profileName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {profileInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
                    <p className="truncate text-xs text-slate-500">{profileEmail}</p>
                  </div>
                </div>
                <button
                  className="mt-3 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => void onLogout()}
                  type="button"
                >
                  <AppIcon>log_out</AppIcon>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
