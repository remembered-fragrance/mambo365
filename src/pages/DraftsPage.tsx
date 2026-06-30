import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/useStore';
import { computeReceiptTotal } from '../domain/calc';
import { formatDateTime, formatQuantity, formatVnd } from '../domain/format';
import type { DraftReceipt, TransactionLine } from '../domain/types';
import { TransactionCropIcon } from '../components/TransactionCrops';

export function DraftsPage() {
  const { data, deleteDraft, completeDraft } = useStore();
  const navigate = useNavigate();

  const finish = (id: string) => {
    const tx = completeDraft(id);
    if (tx) navigate(`/receipt/${tx.id}?new=1`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Phiếu nháp / Hàng chờ</h1>
          <p className="text-sm text-slate-500">{data.drafts.length} phiếu chưa hoàn tất</p>
        </div>
        <Link to="/new" className="rounded-xl bg-green-700 px-3 py-2 text-sm font-semibold text-white">
          Tạo phiếu
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {data.drafts.map((draft) => {
          const totals = computeReceiptTotal(draft.lines);
          const complete = canComplete(draft.lines);
          const firstLine = draft.lines[0];
          return (
            <article key={draft.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <TransactionCropIcon transaction={{ ...draft, date: draft.updatedAt, supplierId: draft.supplierId ?? 'draft' }} className="text-xl" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{draftTitle(draft)}</h2>
                    <p className="text-xs text-slate-400">Cập nhật {formatDateTime(draft.updatedAt)}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${draft.status === 'waiting' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {draft.status === 'waiting' ? 'Hàng chờ' : 'Draft'}
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p>{firstLine?.productName || 'Chưa chọn mặt hàng'}</p>
                <p className="mt-1">
                  {formatQuantity(totals.netWeight)} · <span className="font-semibold text-slate-800">{formatVnd(totals.total)}</span>
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Link
                  to={`/new?draft=${draft.id}`}
                  className="rounded-xl bg-white py-2 text-center text-sm font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  Tiếp tục
                </Link>
                <button
                  type="button"
                  disabled={!complete}
                  onClick={() => finish(draft.id)}
                  className="rounded-xl bg-green-700 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                >
                  Hoàn thành
                </button>
                <button
                  type="button"
                  onClick={() => deleteDraft(draft.id)}
                  className="rounded-xl bg-rose-50 py-2 text-sm font-medium text-rose-600"
                >
                  Xóa
                </button>
              </div>
            </article>
          );
        })}

        {data.drafts.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">Chưa có phiếu nháp nào.</p>
            <Link to="/new" className="mt-3 inline-block font-medium text-green-700">
              Tạo phiếu đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function draftTitle(draft: DraftReceipt): string {
  const customer = draft.supplierName.trim() || 'Khách lẻ';
  const product = draft.lines[0]?.productName || 'Chưa chọn mặt hàng';
  return `${customer} - ${product}`;
}

function canComplete(lines: readonly TransactionLine[]): boolean {
  return lines.some((line) => {
    if (!line.productName.trim() || line.grossWeight <= 0 || line.pricePerUnit <= 0) return false;
    if (line.formulaType === 'rubberLatex') return (line.qualityPercent ?? 0) > 0;
    return true;
  });
}
