import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStore } from '../data/useStore';
import { lineTotals, transactionTotals } from '../domain/calc';
import { receiptShareText } from '../domain/export';
import { formatDateTime, formatVnd, formatWeight } from '../domain/format';
import { cropMeta } from '../domain/types';
import { downloadReceiptPdf, downloadReceiptPng, shareReceiptPdf, shareReceiptPng } from '../domain/receiptExport';
import { AppLogo, CropIcon } from '../components/CropIcon';
import { BackIcon } from '../components/icons';

export function ReceiptDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const navigate = useNavigate();
  const { data, deleteTransaction } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState('');
  const tx = data.transactions.find((t) => t.id === id);

  if (!tx) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Không tìm thấy phiếu.</p>
        <Link to="/history" className="mt-2 inline-block font-medium text-green-700">
          ← Về lịch sử
        </Link>
      </div>
    );
  }

  const { netWeight, total, debt } = transactionTotals(tx);
  const filename = `phieu-${tx.id.slice(-8)}.pdf`;

  const withReceipt = async (fn: () => Promise<void>) => {
    setBusy(true);
    setExportError('');
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất phiếu thất bại';
      setExportError(msg);
    } finally {
      setBusy(false);
    }
  };

  const shareText = async () => {
    const text = receiptShareText(tx);
    try {
      if (navigator.share) await navigator.share({ title: 'Phiếu thu mua', text });
      else {
        await navigator.clipboard.writeText(text);
        alert('Đã sao chép nội dung phiếu!');
      }
    } catch {
      /* cancelled */
    }
  };

  const sharePdf = async () => {
    setBusy(true);
    setExportError('');
    try {
      const shared = await shareReceiptPdf(tx, filename);
      if (!shared) {
        const pngShared = await shareReceiptPng(tx, filename.replace('.pdf', '.png'));
        if (!pngShared) await shareText();
      }
    } catch (err) {
      try {
        await shareText();
      } catch {
        const msg = err instanceof Error ? err.message : 'Chia sẻ thất bại';
        setExportError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-600">
          <BackIcon className="h-5 w-5" /> Quay lại
        </button>
        {isNew && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Phiếu mới tạo
          </span>
        )}
      </div>

      <div ref={receiptRef} data-receipt className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div
          data-receipt-header
          className="bg-gradient-to-br from-green-700 to-emerald-600 px-5 py-4 text-white"
        >
          <p className="text-xs uppercase tracking-wide text-green-100">Phiếu thu mua điện tử</p>
          <div className="mt-2 inline-block rounded-lg bg-white px-2.5 py-1.5">
            <AppLogo className="h-7" />
          </div>
        </div>

        <div data-receipt-body className="space-y-3 p-5">
          <Row label="Người bán" value={tx.supplierName} strong />
          <Row label="Thời gian" value={formatDateTime(tx.date)} />
          {tx.note && <Row label="Ghi chú" value={tx.note} />}

          <div className="my-2 border-t border-dashed border-slate-200" />

          {tx.lines.map((line, i) => {
            const meta = cropMeta(line.crop);
            const lt = lineTotals(line);
            return (
              <div key={line.id} data-receipt-line className="rounded-xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
                  <CropIcon crop={line.crop} className="text-base" />
                  {meta.label}
                  {tx.lines.length > 1 && (
                    <span className="text-xs text-slate-400">#{i + 1}</span>
                  )}
                </div>
                <Row label="KL cân" value={formatWeight(line.grossWeight)} />
                <Row label="KL bì" value={formatWeight(line.tareWeight)} />
                <Row label="KL sản phẩm" value={formatWeight(lt.netWeight)} />
                <Row label="Đơn giá" value={`${formatVnd(line.pricePerKg)}/kg`} />
                <Row label="Thành tiền" value={formatVnd(lt.total)} strong />
              </div>
            );
          })}

          <div className="my-2 border-t border-dashed border-slate-200" />

          <Row label="Tổng khối lượng" value={formatWeight(netWeight)} />
          <div className="flex items-end justify-between">
            <span className="font-medium text-slate-600">Tổng thành tiền</span>
            <span className="text-2xl font-extrabold text-green-700">{formatVnd(total)}</span>
          </div>
          <Row label="Đã thanh toán" value={formatVnd(tx.amountPaid)} />
          {debt > 0 && (
            <div
              data-receipt-debt
              className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2"
            >
              <span className="font-medium text-amber-700">Còn nợ</span>
              <span className="font-bold text-amber-700">{formatVnd(debt)}</span>
            </div>
          )}
        </div>
      </div>

      {exportError && (
        <p className="no-print rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{exportError}</p>
      )}

      <div className="no-print grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionBtn onClick={() => window.print()} disabled={busy}>
          In phiếu
        </ActionBtn>
        <ActionBtn onClick={() => withReceipt(() => downloadReceiptPdf(tx, filename))} disabled={busy}>
          {busy ? 'Đang xử lý…' : 'Tải PDF'}
        </ActionBtn>
        <ActionBtn
          onClick={() => withReceipt(() => downloadReceiptPng(tx, filename.replace('.pdf', '.png')))}
          disabled={busy}
        >
          Tải PNG
        </ActionBtn>
        <ActionBtn onClick={sharePdf} disabled={busy}>
          Chia sẻ
        </ActionBtn>
      </div>

      <button
        onClick={() => {
          if (confirm('Xoá phiếu này?')) {
            deleteTransaction(tx.id);
            navigate('/history');
          }
        }}
        className="no-print w-full py-2 text-sm font-medium text-rose-500"
      >
        Xoá phiếu
      </button>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl bg-white py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 active:scale-[.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>{value}</span>
    </div>
  );
}
