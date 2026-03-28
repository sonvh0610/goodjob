import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUserFacingError } from '../../../lib/user-errors';
import { subscribeToRealtime } from '../../../lib/realtime';
import {
  fetchWallet,
  fetchWalletTransactions,
  type WalletTransactionItem,
} from '../api';

export function useWalletPage() {
  const [wallet, setWallet] = useState<Awaited<
    ReturnType<typeof fetchWallet>
  > | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingInitialTransactions, setLoadingInitialTransactions] =
    useState(false);

  const loadWalletPageData = useCallback(async () => {
    try {
      setLoadingInitialTransactions(true);
      const [walletResult, transactionResult] = await Promise.all([
        fetchWallet(),
        fetchWalletTransactions(null),
      ]);
      setWallet(walletResult);
      setTransactions(transactionResult.items);
      setCursor(transactionResult.nextCursor);
      setHasMoreTransactions(Boolean(transactionResult.nextCursor));
      setError(null);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'wallet-load',
          fallback: 'Unable to load your wallet right now. Please try again.',
        })
      );
    } finally {
      setLoadingInitialTransactions(false);
    }
  }, []);

  const loadMoreTransactions = useCallback(async () => {
    if (!cursor || loadingMoreTransactions) return;

    try {
      setLoadingMoreTransactions(true);
      const result = await fetchWalletTransactions(cursor);
      setTransactions((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMoreTransactions(Boolean(result.nextCursor));
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'wallet-load',
          fallback:
            'Unable to load more transactions right now. Please try again.',
        })
      );
    } finally {
      setLoadingMoreTransactions(false);
    }
  }, [cursor, loadingMoreTransactions]);

  useEffect(() => {
    void loadWalletPageData();
  }, [loadWalletPageData]);

  useEffect(() => {
    return subscribeToRealtime({
      path: '/notifications/stream',
      onFallback: loadWalletPageData,
      onMessage: (event) => {
        const payload = JSON.parse(event.data) as { event: string };
        if (
          payload.event === 'wallet.points_received' ||
          payload.event === 'feed.new'
        ) {
          void loadWalletPageData();
        }
        if (payload.event === 'notification.new') {
          void loadWalletPageData();
        }
      },
    });
  }, [loadWalletPageData]);

  const spentRatio = useMemo(() => {
    if (!wallet) return 0;
    return Math.min(
      (wallet.givingWallet.spentPoints / wallet.givingWallet.limitPoints) * 100,
      100
    );
  }, [wallet]);

  return {
    wallet,
    transactions,
    hasMoreTransactions,
    loadingMoreTransactions,
    loadingInitialTransactions,
    error,
    spentRatio,
    loadMoreTransactions,
  };
}
