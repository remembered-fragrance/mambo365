import html2canvas from 'html2canvas';
import { lineTotals, transactionTotals } from './calc';
import { formatDateTime, formatQuantity, formatVnd } from './format';
import { cropMeta, type Transaction } from './types';

const el = (
  tag: string,
  style: string,
  children: (Node | string)[] = [],
): HTMLElement => {
  const node = document.createElement(tag);
  node.setAttribute('style', style);
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
};

const row = (label: string, value: string, strong = false): HTMLElement =>
  el(
    'div',
    'display:flex;justify-content:space-between;align-items:center;font-size:13px;margin:4px 0;gap:12px;',
    [
      el('span', 'color:#64748b;', [label]),
      el('span', strong ? 'color:#0f172a;font-weight:600;text-align:right;' : 'color:#334155;text-align:right;', [value]),
    ],
  );

const divider = (): HTMLElement =>
  el('div', 'border-top:1px dashed #e2e8f0;margin:12px 0;');

const productLabel = (name: string, crop?: Parameters<typeof cropMeta>[0]): string => {
  const meta = cropMeta(crop);
  const icon = meta?.emoji || (crop === 'pepper' ? '●' : '');
  return `${icon} ${name}`.trim();
};

/** DOM phiếu chỉ dùng inline hex - không Tailwind, không oklch. */
export const buildReceiptExportElement = (tx: Transaction): HTMLElement => {
  const { netWeight, total, debt } = transactionTotals(tx);

  const root = el(
    'div',
    'width:380px;background:#ffffff;color:#1e293b;font-family:system-ui,sans-serif;border-radius:16px;overflow:hidden;',
  );

  const header = el('div', 'background:#15803d;color:#ffffff;padding:16px 20px;');
  header.appendChild(
    el('p', 'margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#dcfce7;', [
      'Phiếu thu mua điện tử',
    ]),
  );
  const logoWrap = el('div', 'margin-top:8px;display:inline-block;background:#ffffff;border-radius:8px;padding:6px 10px;');
  const logo = document.createElement('img');
  logo.src = `${window.location.origin}/iconapp.jpg`;
  logo.alt = 'THUMUA365';
  logo.crossOrigin = 'anonymous';
  logo.setAttribute('style', 'height:28px;width:auto;display:block;');
  logoWrap.appendChild(logo);
  header.appendChild(logoWrap);
  root.appendChild(header);

  const body = el('div', 'padding:20px;background:#ffffff;');
  body.appendChild(row('Người bán', tx.supplierName, true));
  body.appendChild(row('Thời gian', formatDateTime(tx.date)));
  if (tx.note) body.appendChild(row('Ghi chú', tx.note));
  body.appendChild(divider());

  tx.lines.forEach((line, i) => {
    const lt = lineTotals(line);
    const block = el(
      'div',
      'background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:8px;',
    );
    const title = el('div', 'font-weight:600;color:#1e293b;font-size:13px;margin-bottom:8px;', [
      productLabel(line.productName, line.crop) + (tx.lines.length > 1 ? ` #${i + 1}` : ''),
    ]);
    block.appendChild(title);
    block.appendChild(row('KL/SL cân', formatQuantity(line.grossWeight, line.unit)));
    if (line.formulaType === 'netAfterTare') {
      block.appendChild(row('KL bì/trừ', formatQuantity(line.tareWeight ?? 0, line.unit)));
    }
    if (line.formulaType === 'rubberLatex') {
      block.appendChild(row('Hàm lượng mủ', `${line.qualityPercent ?? 0}%`));
    }
    block.appendChild(row('KL/SL tính tiền', formatQuantity(lt.netWeight, line.unit)));
    block.appendChild(row('Đơn giá', `${formatVnd(line.pricePerUnit)}/${line.unit}`));
    block.appendChild(row('Tạm tính', formatVnd(lt.rawTotal)));
    block.appendChild(row('Thành tiền', formatVnd(lt.total), true));
    body.appendChild(block);
  });

  body.appendChild(divider());
  body.appendChild(row('Tổng KL/SL tính tiền', formatQuantity(netWeight)));

  const totalRow = el(
    'div',
    'display:flex;justify-content:space-between;align-items:flex-end;margin:8px 0;gap:12px;',
  );
  totalRow.appendChild(el('span', 'color:#475569;font-weight:500;font-size:13px;', ['Tổng thành tiền']));
  totalRow.appendChild(
    el('span', 'color:#15803d;font-size:24px;font-weight:800;text-align:right;', [formatVnd(total)]),
  );
  body.appendChild(totalRow);
  body.appendChild(row('Đã thanh toán', formatVnd(tx.amountPaid)));

  if (debt > 0) {
    const debtBox = el(
      'div',
      'display:flex;justify-content:space-between;align-items:center;background:#fffbeb;border-radius:8px;padding:8px 12px;margin-top:8px;',
    );
    debtBox.appendChild(el('span', 'color:#b45309;font-weight:500;font-size:13px;', ['Còn nợ']));
    debtBox.appendChild(el('span', 'color:#b45309;font-weight:700;font-size:13px;', [formatVnd(debt)]));
    body.appendChild(debtBox);
  }

  root.appendChild(body);
  return root;
};

const waitImages = async (root: HTMLElement): Promise<void> => {
  const imgs = [...root.querySelectorAll('img')];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );
};

/** Capture trong iframe trống - html2canvas không đọc stylesheet Tailwind oklch. */
export const captureInIsolatedFrame = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:420px;height:2000px;border:0;visibility:hidden;';

  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  if (!idoc) {
    document.body.removeChild(iframe);
    throw new Error('Không tạo được khung xuất phiếu');
  }

  idoc.open();
  idoc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:8px;background:#ffffff;"></body></html>',
  );
  idoc.close();

  idoc.body.appendChild(element);
  await waitImages(element);

  try {
    return await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 420,
    });
  } finally {
    document.body.removeChild(iframe);
  }
};

export const captureReceipt = async (tx: Transaction): Promise<HTMLCanvasElement> => {
  const element = buildReceiptExportElement(tx);
  return captureInIsolatedFrame(element);
};
