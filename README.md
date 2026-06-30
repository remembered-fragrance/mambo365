# THUMUA365 — Sổ thu mua điện tử (MVP)

MVP cho Checkpoint 3, môn EXE101_SU26 (nhóm THUMUA365 / MKT1906).
Web app mobile-first giúp thương lái nông sản thay sổ tay giấy bằng phiếu thu mua điện tử, có thể xử lý nhiều khách hàng cùng lúc và lưu dữ liệu offline trên trình duyệt.

## Chạy thử
```bash
npm install
npm run dev      # http://localhost:5173
```

Ứng dụng có sẵn dữ liệu mẫu và lưu trên trình duyệt (localStorage) — chạy hoàn toàn offline, không cần backend.

Tài khoản demo:

```text
demo@thumua365.vn / demo123
```

## Scripts
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra mã (oxlint) |

## Tính năng
- **Tạo phiếu thu mua** với nhiều dòng mặt hàng, tự động tính tiền và làm tròn thành tiền đến hàng nghìn.
- **Mặt hàng linh hoạt**: Cao su, Điều, Cà phê, Hồ tiêu chỉ là gợi ý nhanh; người dùng có thể nhập, thêm, sửa, ẩn/hiện mặt hàng riêng.
- **Công thức theo mặt hàng**:
  - Thông thường: khối lượng × đơn giá.
  - Cân trừ bì: (khối lượng cân − khối lượng bì) × đơn giá.
  - Cao su: khối lượng × hàm lượng mủ (%) × đơn giá.
  - Hao hụt %: khối lượng × (1 − hao hụt %) × đơn giá.
- **Phiếu nháp / Hàng chờ**: tự động lưu phiếu đang nhập, chuyển đổi giữa nhiều khách hàng, tiếp tục hoặc hoàn thành phiếu sau.
- **Lịch sử** giao dịch có tìm kiếm, lọc theo thời gian, trạng thái thanh toán, mặt hàng và người bán.
- **Phiếu điện tử**: xem, in, tải PDF/PNG, chia sẻ nội dung phiếu.
- **Công nợ** theo từng người bán, ghi nhận trả đủ.
- **Người bán**: danh sách nông hộ/đối tác với tổng chi mua, khối lượng và công nợ.
- **Tiện ích**: máy tính nhanh, công thức cao su nhanh, ghi chú có ghim/tìm kiếm/đánh dấu xong.
- **Dashboard**: chi mua hôm nay/tuần/tháng, biểu đồ 7 ngày, cơ cấu theo mặt hàng, tổng công nợ.

## Cập nhật mới trong branch `update-30062026`
- Chuyển domain từ 4 loại crop cố định sang danh mục `Product` có thể mở rộng.
- Thêm màn **Mặt hàng** để quản lý danh mục thường dùng.
- Thêm màn **Phiếu nháp / Hàng chờ** với auto-save localStorage và badge số lượng trên điều hướng.
- Sửa công thức tính tiền trung tâm trong `src/domain/calc.ts`, luôn làm tròn thành tiền tới 1.000đ.
- Thêm trường **Hàm lượng mủ (%)** cho cao su và công thức `ROUND(khối lượng × hàm lượng × đơn giá, -3)`.
- Cập nhật lịch sử, dashboard, công nợ, phiếu điện tử, export PDF/Excel để hiển thị mặt hàng custom.
- Thêm màn **Tiện ích** gồm máy tính và ghi chú.
- Cập nhật điều hướng desktop/mobile để giữ giao diện gọn trên cả PC và điện thoại.

## Tech stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router.

## Cấu trúc
- `src/domain` — kiểu dữ liệu, hàm tính tiền, format, lọc & thống kê thuần.
- `src/data` — repository localStorage, migration dữ liệu cũ, store context, dữ liệu mẫu.
- `src/components` — layout, điều hướng, icon, badge và thành phần dùng chung.
- `src/pages` — dashboard, tạo phiếu, draft, lịch sử, công nợ, người bán, mặt hàng, tiện ích, tài khoản.

## Ghi chú dữ liệu
- Dữ liệu được lưu theo từng tài khoản trong localStorage.
- Dữ liệu cũ theo crop cố định vẫn được normalize/migrate khi load.
- Đặt lại dữ liệu demo: xóa key `thumua365:data:v2:user-demo` trong localStorage rồi tải lại trang.
- Legacy key `thumua365:data:v1` vẫn được đọc để migrate nếu tồn tại.
