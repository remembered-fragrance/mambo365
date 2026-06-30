import * as XLSX from 'xlsx';
import { transactionTotals, lineTotals } from './calc';
import { cropMeta } from './types';
import type { Transaction } from './types';
import { formatDate, formatDateTime, formatVnd, formatWeight } from './format';
import { downloadListPdf } from './receiptExport';

export const exportTransactionsXlsx = (transactions: readonly Transaction[], filename: string): void => {
  const rows = transactions.flatMap((t) => {
    const { total, debt } = transactionTotals(t);
    return t.lines.map((line, i) => {
      const lt = lineTotals(line);
      return {
        'Mã phiếu': i === 0 ? t.id : '',
        'Ngày': i === 0 ? formatDate(t.date) : '',
        'Người bán': i === 0 ? t.supplierName : '',
        'Sản phẩm': cropMeta(line.crop).label,
        'KL cân (kg)': line.grossWeight,
        'KL bì (kg)': line.tareWeight,
        'KL sản phẩm (kg)': lt.netWeight,
        'Đơn giá': line.pricePerKg,
        'Thành tiền dòng': lt.total,
        'Tổng phiếu': i === 0 ? total : '',
        'Đã trả': i === 0 ? t.amountPaid : '',
        'Còn nợ': i === 0 ? debt : '',
        'Trạng thái': i === 0 ? (debt > 0 ? 'Chưa thanh toán' : 'Đã thanh toán') : '',
        'Ghi chú': i === 0 ? (t.note ?? '') : '',
      };
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Thu mua');
  XLSX.writeFile(wb, filename);
};

export const exportTransactionsPdf = async (
  transactions: readonly Transaction[],
  filename: string,
): Promise<void> => {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:-10000px;top:0;width:900px;padding:24px;background:#fff;color:#0f172a;font-family:system-ui,sans-serif;font-size:11px';

  const totalSpent = transactions.reduce((s, t) => s + transactionTotals(t).total, 0);
  const totalWeight = transactions.reduce((s, t) => s + transactionTotals(t).netWeight, 0);

  const body = transactions
    .map((t) => {
      const { total, netWeight, debt } = transactionTotals(t);
      const crops = t.lines.map((l) => cropMeta(l.crop).label).join(', ');
      return `<tr>
        <td style="padding:6px;border:1px solid #e2e8f0">${formatDate(t.date)}</td>
        <td style="padding:6px;border:1px solid #e2e8f0">${t.supplierName}</td>
        <td style="padding:6px;border:1px solid #e2e8f0">${crops}</td>
        <td style="padding:6px;border:1px solid #e2e8f0;text-align:right">${formatWeight(netWeight)}</td>
        <td style="padding:6px;border:1px solid #e2e8f0;text-align:right">${formatVnd(total)}</td>
        <td style="padding:6px;border:1px solid #e2e8f0;text-align:right">${debt > 0 ? formatVnd(debt) : 'Đã trả đủ'}</td>
      </tr>`;
    })
    .join('');

  el.innerHTML = `
    <h1 style="font-size:18px;margin:0 0 4px">THUMUA365 — Lịch sử giao dịch</h1>
    <p style="margin:0 0 16px;color:#64748b;font-size:12px">
      ${transactions.length} phiếu · ${formatWeight(totalWeight)} · ${formatVnd(totalSpent)} · Xuất ${formatDate(new Date().toISOString())}
    </p>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="text-align:left;padding:6px;border:1px solid #e2e8f0">Ngày</th>
          <th style="text-align:left;padding:6px;border:1px solid #e2e8f0">Người bán</th>
          <th style="text-align:left;padding:6px;border:1px solid #e2e8f0">Nông sản</th>
          <th style="text-align:right;padding:6px;border:1px solid #e2e8f0">KL thực</th>
          <th style="text-align:right;padding:6px;border:1px solid #e2e8f0">Thành tiền</th>
          <th style="text-align:right;padding:6px;border:1px solid #e2e8f0">Thanh toán</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;

  document.body.appendChild(el);
  try {
    await downloadListPdf(el, filename);
  } finally {
    document.body.removeChild(el);
  }
};

export const receiptShareText = (t: Transaction): string => {
  const { netWeight, total, debt } = transactionTotals(t);
  const lines = t.lines
    .map((l) => {
      const lt = lineTotals(l);
      return `- ${cropMeta(l.crop).label}: cân ${formatWeight(l.grossWeight)}, bì ${formatWeight(l.tareWeight)}, thực ${formatWeight(lt.netWeight)}, ${formatVnd(lt.total)}`;
    })
    .join('\n');

  return `PHIẾU THU MUA - THUMUA365
Người bán: ${t.supplierName}
Thời gian: ${formatDateTime(t.date)}
${lines}
Tổng KL: ${formatWeight(netWeight)}
Thành tiền: ${formatVnd(total)}
Đã trả: ${formatVnd(t.amountPaid)}${debt > 0 ? `\nCòn nợ: ${formatVnd(debt)}` : ''}`;
};
