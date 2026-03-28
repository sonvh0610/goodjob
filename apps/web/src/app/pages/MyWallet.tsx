import { useEffect, useState } from 'react';
import { apiRequest, wsUrl } from '../lib/api';
import { getUserFacingError } from '../lib/user-errors';

interface WalletResponse {
  wallet: {
    receivedWallet: {
      userId: string;
      availablePoints: number;
      updatedAt: string;
    };
    givingWallet: {
      monthKey: string;
      limitPoints: number;
      spentPoints: number;
      remainingPoints: number;
      updatedAt: string;
    };
  };
}

export default function MyWallet() {
  const [wallet, setWallet] = useState<WalletResponse['wallet'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = async () => {
    try {
      const result = await apiRequest<WalletResponse>('/wallet');
      setWallet(result.wallet);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'wallet-load',
          fallback: 'Unable to load your wallet right now. Please try again.',
        })
      );
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl('/notifications/stream'));
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { event: string };
      if (payload.event === 'wallet.points_received' || payload.event === 'feed.new') {
        void loadWallet();
      }
    };
    return () => socket.close();
  }, []);

  const spentRatio = wallet
    ? Math.min((wallet.givingWallet.spentPoints / wallet.givingWallet.limitPoints) * 100, 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 md:py-8 bg-surface-container-low">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
          My Wallet
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Track persistent received points and your monthly giving budget.
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_12px_40px_rgba(55,39,77,0.06)]">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Received Wallet
            </p>
            <p className="mt-3 text-5xl font-black text-primary">
              {wallet?.receivedWallet.availablePoints ?? 0}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">Points available to redeem</p>
            <p className="mt-4 text-xs text-on-surface-variant">
              Last update:{' '}
              {wallet
                ? new Date(wallet.receivedWallet.updatedAt).toLocaleString()
                : 'Not available'}
            </p>
          </section>

          <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_12px_40px_rgba(55,39,77,0.06)]">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Giving Wallet ({wallet?.givingWallet.monthKey ?? '---- --'})
            </p>
            <p className="mt-3 text-3xl font-black text-on-surface">
              {wallet?.givingWallet.remainingPoints ?? 0}
              <span className="ml-2 text-sm font-semibold text-on-surface-variant">
                / {wallet?.givingWallet.limitPoints ?? 200} remaining
              </span>
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Spent {wallet?.givingWallet.spentPoints ?? 0} this month
            </p>
            <div className="mt-4 h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${spentRatio}%` }}
              />
            </div>
            <p className="mt-4 text-xs text-on-surface-variant">
              Resets on the first day of each UTC month. Unused giving points expire.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
