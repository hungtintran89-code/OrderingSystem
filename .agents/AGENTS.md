# Project-specific Agent Rules

## Database Migrations Rule
- Khi có bất kỳ thay đổi nào về cấu trúc bảng (schema changes like ADD COLUMN, DROP COLUMN, ALTER TABLE, CREATE TABLE, etc.) hoặc thông tin/dữ liệu khởi tạo/cập nhật bảng trong database:
  - **KHÔNG** chỉ sửa entity Java hay chạy SQL trực tiếp thủ công.
  - **BẮT BUỘC** phải tạo 1 file migration mới trong thư mục `backend/src/main/resources/db/migration/`.
  - Quy tắc đặt tên file migration: `V<Next_Version>__<Mo_Ta_Ngan_Gon>.sql` (Ví dụ: `V10__add_new_column_to_table.sql`).
  - Đảm bảo script migration độc lập, chuẩn Flyway SQL, để mọi thành viên khi pull code về chạy app sẽ tự động áp dụng thay đổi mới nhất của database.

## Backend Auto-Restart Rule
- Khi có bất kỳ thay đổi nào ở source code backend (Java code, configuration, properties, v.v.):
  - **BẮT BUỘC** phải dừng/restart và khởi chạy lại ứng dụng Backend (`.\mvnw.cmd spring-boot:run`) trong background task để cập nhật và áp dụng ngay byte-code mới nhất vào memory runtime.
