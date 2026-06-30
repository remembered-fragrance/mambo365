import { jsPDF } from 'jspdf';
import type { Transaction } from './types';
import { captureInIsolatedFrame, captureReceipt } from './receiptExportDom';

const MARGIN_MM = 8;

const fitToPage = (pdf: jsPDF, img: string, canvas: HTMLCanvasElement): void => {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - MARGIN_MM * 2;
  const maxH = pageH - MARGIN_MM * 2;
  let w = maxW;
  let h = (canvas.height * w) / canvas.width;
  if (h > maxH) {
    h = maxH;
    w = (canvas.width * h) / canvas.height;
  }
  pdf.addImage(img, 'PNG', (pageW - w) / 2, MARGIN_MM, w, h);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 200);
};

export const shareOrDownload = async (
  blob: Blob,
  filename: string,
  title: string,
): Promise<'shared' | 'downloaded'> => {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return 'shared';
  }
  downloadBlob(blob, filename);
  return 'downloaded';
};

export const downloadReceiptPdf = async (tx: Transaction, filename: string): Promise<void> => {
  const canvas = await captureReceipt(tx);
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  fitToPage(pdf, img, canvas);
  await shareOrDownload(pdf.output('blob'), filename, 'Phiếu thu mua THUMUA365');
};

export const downloadReceiptPng = async (tx: Transaction, filename: string): Promise<void> => {
  const canvas = await captureReceipt(tx);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh PNG'))), 'image/png');
  });
  await shareOrDownload(blob, filename, 'Phiếu thu mua THUMUA365');
};

export const shareReceiptPdf = async (tx: Transaction, filename: string): Promise<boolean> => {
  const canvas = await captureReceipt(tx);
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  fitToPage(pdf, img, canvas);
  const result = await shareOrDownload(pdf.output('blob'), filename, 'Phiếu thu mua THUMUA365');
  return result === 'shared';
};

export const shareReceiptPng = async (tx: Transaction, filename: string): Promise<boolean> => {
  const canvas = await captureReceipt(tx);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh PNG'))), 'image/png');
  });
  const result = await shareOrDownload(blob, filename, 'Phiếu thu mua THUMUA365');
  return result === 'shared';
};

/** Xuất danh sách (lịch sử) — element phải chỉ có inline hex, không class Tailwind. */
export const downloadListPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  const canvas = await captureInIsolatedFrame(element);
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;
  let y = 0;
  let remaining = imgH;
  while (remaining > 0) {
    if (y > 0) pdf.addPage();
    pdf.addImage(img, 'PNG', 0, -y, pageW, imgH);
    y += pageH;
    remaining -= pageH;
  }
  downloadBlob(pdf.output('blob'), filename);
};
