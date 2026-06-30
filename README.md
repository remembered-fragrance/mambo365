# THUMUA365 — Sổ thu mua điện tử (MVP)

MVP cho Checkpoint 3, môn EXE101_SU26 (nhóm THUMUA365 / MKT1906).
Web app mobile-first giúp thương lái nông sản (cao su, điều, cà phê, tiêu) thay sổ tay giấy bằng phiếu thu mua điện tử.

## Chạy thử
```bash
npm install
npm run dev      # http://localhost:5173
```
Ứng dụng có sẵn dữ liệu mẫu và lưu trên trình duyệt (localStorage) — chạy hoàn toàn offline, không cần backend.

## Scripts
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra mã (oxlint) |

## Tính năng
- **Tạo phiếu thu mua** với tự động tính tiền: khối lượng × (1 − % trừ tạp chất) × đơn giá.
- **Lịch sử** giao dịch có tìm kiếm & lọc theo loại nông sản.
- **Phiếu điện tử**: xem, in, gửi cho người bán.
- **Công nợ** theo từng người bán, ghi nhận trả nợ.
- **Dashboard**: chi mua hôm nay/tuần/tháng, biểu đồ 7 ngày, cơ cấu theo loại nông sản, tổng công nợ.

## Tech stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router.

## Cấu trúc
- `src/domain` — kiểu dữ liệu, hàm tính tiền & thống kê (thuần, không phụ thuộc UI).
- `src/data` — repository localStorage (cập nhật bất biến) + store context + dữ liệu mẫu.
- `src/components` — layout, điều hướng, thành phần dùng chung.
- `src/pages` — các màn hình.

> Đặt lại dữ liệu mẫu: xoá key `thumua365:data:v1` trong localStorage rồi tải lại trang.
