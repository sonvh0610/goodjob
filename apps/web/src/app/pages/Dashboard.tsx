import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon } from '../components/ui/AppIcon';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { getUserFacingError } from '../lib/user-errors';

interface WalletResponse {
  wallet: {
    receivedWallet: {
      availablePoints: number;
      updatedAt: string;
    };
    givingWallet: {
      monthKey: string;
      limitPoints: number;
      spentPoints: number;
      remainingPoints: number;
    };
  };
}

interface FeedPreviewItem {
  id: string;
  senderName: string;
  points: number;
  description: string;
  createdAt: string;
}

interface FeedResponse {
  items: FeedPreviewItem[];
  nextCursor: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse['wallet'] | null>(null);
  const [recentFeed, setRecentFeed] = useState<FeedPreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const firstName =
    user?.displayName.trim().split(/\s+/)[0] &&
    user.displayName.trim().length > 0
      ? user.displayName.trim().split(/\s+/)[0]
      : 'there';

  useEffect(() => {
    void (async () => {
      try {
        const [walletRes, feedRes] = await Promise.all([
          apiRequest<WalletResponse>('/wallet'),
          apiRequest<FeedResponse>('/feed?limit=3'),
        ]);
        setWallet(walletRes.wallet);
        setRecentFeed(feedRes.items);
      } catch (requestError) {
        setError(
          getUserFacingError(requestError, {
            context: 'dashboard-load',
            fallback:
              'Unable to load your dashboard right now. Please try again.',
          })
        );
      }
    })();
  }, []);

  const spentRatio = useMemo(() => {
    if (!wallet) return 0;
    return Math.min(
      (wallet.givingWallet.spentPoints / wallet.givingWallet.limitPoints) * 100,
      100
    );
  }, [wallet]);

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 md:py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
              Hello, {firstName}! 👋
            </h1>
            <p className="text-on-surface-variant text-lg">
              Keep recognizing teammates and building momentum this month.
            </p>
          </div>
          <Link
            to="/send-kudos"
            className="inline-flex items-center px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-bold hover:bg-primary-dim transition-colors"
          >
            <AppIcon className="material-symbols-outlined mr-2 text-sm">
              send
            </AppIcon>
            Send Kudos
          </Link>
        </header>
        {error ? <p className="mb-6 text-sm text-red-600">{error}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <section className="md:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(55,39,77,0.06)] flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-xs mb-1">
                    Received Wallet Balance
                  </p>
                  <h2 className="text-6xl font-black text-primary">
                    {wallet?.receivedWallet.availablePoints ?? 0}{' '}
                    <span className="text-2xl font-bold">pts</span>
                  </h2>
                </div>
                <div className="bg-surface-container-high p-4 rounded-3xl">
                  <AppIcon
                    className="material-symbols-outlined text-primary text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_balance_wallet
                  </AppIcon>
                </div>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-bold uppercase mb-2">
                  Monthly Giving Wallet ({wallet?.givingWallet.monthKey ?? '--'}
                  )
                </p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold text-on-surface">
                    {wallet?.givingWallet.remainingPoints ?? 0}
                  </span>
                  <span className="text-on-surface-variant text-sm mb-1">
                    / {wallet?.givingWallet.limitPoints ?? 200} pts remaining
                  </span>
                </div>
                <div className="w-full max-w-xl h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-container rounded-full transition-all"
                    style={{ width: `${spentRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-4 bg-gradient-to-br from-primary to-primary-dim rounded-xl p-8 text-on-primary shadow-xl shadow-primary/20 flex flex-col items-center justify-center text-center group">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform">
              <AppIcon
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </AppIcon>
            </div>
            <h3 className="text-2xl font-bold mb-2">This Month’s Budget</h3>
            <p className="text-primary-container text-sm mb-8 px-4">
              {wallet?.givingWallet.spentPoints ?? 0} spent from{' '}
              {wallet?.givingWallet.limitPoints ?? 200} monthly giving points.
            </p>
            <Link
              to="/wallet"
              className="w-full bg-primary text-on-primary font-bold py-4 px-6 rounded-full hover:bg-primary-dim transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <AppIcon className="material-symbols-outlined text-xl">
                visibility
              </AppIcon>
              View Wallet
            </Link>
          </section>

          <section className="md:col-span-12 bg-white/40 rounded-xl p-1">
            <div className="p-6 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-lg text-on-surface">
                Recent Recognition
              </h3>
              <Link
                className="text-primary text-sm font-bold hover:underline"
                to="/feed"
              >
                View All Feed
              </Link>
            </div>
            <div className="space-y-4 p-4">
              {recentFeed.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <AppIcon className="material-symbols-outlined text-primary">
                      person
                    </AppIcon>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">
                      <span className="font-bold">{item.senderName}</span>{' '}
                      shared kudos
                    </p>
                    <p className="text-on-surface-variant text-sm line-clamp-1 italic">
                      "{item.description}"
                    </p>
                  </div>
                  <div className="bg-primary-container/20 px-3 py-1 rounded-full shrink-0">
                    <span className="text-xs font-bold text-primary">
                      +{item.points} pts
                    </span>
                  </div>
                </div>
              ))}
              {recentFeed.length === 0 ? (
                <p className="text-sm text-on-surface-variant px-2 py-4">
                  No recent kudos yet. Be the first to recognize someone today.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
