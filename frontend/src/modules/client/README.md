# 📱 THƯ MỤC GIAO DIỆN KHÁCH HÀNG (CLIENT CUSTOMER PORTAL)

Thư mục này được thiết kế làm **Workspace Độc Lập** dành riêng cho giao diện Khách hàng (Client Ordering App đặt món tại bàn qua mã QR).

## 📂 Cấu Trúc Thư Mục Dành Cho Merge Code:
```
client/
├── layouts/       # Chứa các Layout đặt món cho khách (vd: ClientLayout.tsx)
├── pages/         # Chứa các Trang xem Menu, Giỏ hàng, Đặt món (vd: MenuPage.tsx, CartPage.tsx)
├── components/    # Chứa các Component giao diện khách (vd: FoodCard.tsx, CartDrawer.tsx)
└── services/      # Chứa các API dịch vụ gửi đơn hàng dành cho khách (vd: clientOrderApi.ts)
```

## 🚀 Hướng Dẫn Merge Code Giao Diện Client:
1. Đặt toàn bộ Layout giao diện khách vào thư mục `layouts/`.
2. Đặt các trang đặt món của khách vào thư mục `pages/`.
3. Khai báo Route trong file `src/app.tsx`:
   ```tsx
   import { ClientLayout } from './modules/client/layouts/ClientLayout';
   import { ClientMenuPage } from './modules/client/pages/ClientMenuPage';
   ```
