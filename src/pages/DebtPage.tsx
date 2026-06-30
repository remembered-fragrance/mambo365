import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/useStore';
import { transactionTotals } from '../domain/calc';
import { formatDate, formatVnd } from '../domain/format';
import { TransactionCropIcon } from '../components/TransactionCrops';
import { debtsBySupplier, totalOutstandingDebt } from '../domain/selectors';

export function DebtPage() {
  const { data, recordPayment } = useStore();
  const groups = debtsBySupplier(data);
  const total = totalOutstandingDebt(data);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Công nợ phải trả</h1>

      <div className="rounded-2xl bg-amber-50 p-5">
        <p className="text-sm text-amber-700">Tổng còn nợ người bán</p>
        <p className="mt-1 text-3xl font-extrabold text-amber-700">{formatVnd(total)}</p>
        <p className="mt-1 text-xs text-amber-600">{groups.length} người bán</p>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.supplierId} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <button
              onClick={() => setOpenId(openId === g.supplierId ? null : g.supplierId)}
              className="flex w-full items-center justify-between p-4 text-left active:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-800">{g.supplierName}</p>
                <p className="text-xs text-slate-400">{g.transactions.length} phiếu chưa trả đủ</p>
              </div>
              <p className="font-bold text-amber-600">{formatVnd(g.debt)}</p>
            </button>

            {openId === g.supplierId && (
              <div className="space-y-2 border-t border-slate-100 bg-slate-50 p-3">
                {g.transactions.map((t) => (
                  <DebtRow
                    key={t.id}
                    transaction={t}
                    date={formatDate(t.date)}
                    debt={transactionTotals(t).debt}
                    onPay={() => recordPayment(t.id, transactionTotals(t).debt)}
                    detailHref={`/receipt/${t.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-sm text-slate-500">Tuyệt vời! Không còn khoản nợ nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DebtRow({
  transaction,
  date,
  debt,
  onPay,
  detailHref,
}: {
  transaction: Parameters<typeof TransactionCropIcon>[0]['transaction'];
  date: string;
  debt: number;
  onPay: () => void;
  detailHref: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-3">
      <Link to={detailHref} className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center">
          <TransactionCropIcon transaction={transaction} className="text-lg" />
        </span>
        <div>
          <p className="text-sm text-slate-700">{date}</p>
          <p className="text-xs font-medium text-amber-600">Nợ {formatVnd(debt)}</p>
        </div>
      </Link>
      <button
        onClick={onPay}
        className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white active:scale-95"
      >
        Trả đủ
      </button>
    </div>
  );
}
