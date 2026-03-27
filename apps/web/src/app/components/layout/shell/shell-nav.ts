export type NavItem = {
  key: 'dashboard' | 'feed' | 'send' | 'rewards' | 'wallet' | 'notifications' | 'admin';
  label: string;
  icon: string;
  to: string;
};

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/' },
  { key: 'feed', label: 'Kudos Feed', icon: 'forum', to: '/feed' },
  { key: 'send', label: 'Send Kudos', icon: 'stars', to: '/send-kudos' },
  { key: 'rewards', label: 'Rewards', icon: 'redeem', to: '/rewards' },
  { key: 'wallet', label: 'My Wallet', icon: 'account_balance_wallet', to: '/wallet' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications', to: '/notifications' },
  { key: 'admin', label: 'Admin', icon: 'admin_panel_settings', to: '/admin' },
];
