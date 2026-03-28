import type { WalletTransactionItem } from '../api';

type WalletTransactionHistoryProps = {
  items: WalletTransactionItem[];
  loadingInitial?: boolean;
  loadingMore?: boolean;
};

function toReasonLabel(reason: string): string {
  switch (reason) {
    case 'kudo_received':
      return 'Received kudos';
    case 'kudo_sent':
      return 'Sent kudos';
    case 'reward_redeemed':
      return 'Redeemed reward';
    default:
      return reason
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
}

export function WalletTransactionHistory({
  items,
  loadingInitial = false,
  loadingMore = false,
}: WalletTransactionHistoryProps) {
  return (
    <section className="mt-8 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_12px_40px_rgba(55,39,77,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">
          Point Transactions
        </h2>
      </div>

      {loadingInitial ? (
        <p className="text-sm text-on-surface-variant">
          Loading transactions...
        </p>
      ) : null}

      {items.length === 0 && !loadingInitial ? (
        <p className="text-sm text-on-surface-variant">
          No point transactions yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container text-left text-on-surface-variant">
                <th className="px-2 py-2 font-semibold">Date</th>
                <th className="px-2 py-2 font-semibold">Type</th>
                <th className="px-2 py-2 font-semibold">Detail</th>
                <th className="px-2 py-2 font-semibold">Points</th>
                <th className="px-2 py-2 font-semibold">Ref</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  className="border-b border-surface-container/70"
                  key={item.id}
                >
                  <td className="px-2 py-2 text-on-surface-variant">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-on-surface">
                    {toReasonLabel(item.reason)}
                  </td>
                  <td className="px-2 py-2 text-on-surface-variant">
                    {item.detail ?? '-'}
                  </td>
                  <td
                    className={`px-2 py-2 font-semibold ${
                      item.direction === 'credit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {item.direction === 'credit' ? '+' : '-'}
                    {Math.abs(item.deltaPoints)}
                  </td>
                  <td className="px-2 py-2 text-on-surface-variant">
                    {item.refType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loadingMore ? (
        <p className="mt-3 text-sm text-on-surface-variant">
          Loading more transactions...
        </p>
      ) : null}
    </section>
  );
}
