-- =============================================================================
-- DATABASE MIGRATION SCRIPT V4: ESSENTIAL SEED DATA FOR TESTING
-- Framework: Flyway / PostgreSQL
-- Description:
--   1. Ensures DDL for kitchen_tickets table exists.
--   2. Seeds 10 Users with all roles (MANAGER, CASHIER, STAFF, KITCHEN).
--      Default password for all users: admin123 (BCrypt hash)
--   3. Seeds 10 Restaurant Tables (Bàn 01 -> Bàn 10) with QR tokens & URLs.
--   4. Seeds 5 Categories (Khai Vị, Món Chính, Lẩu & Nướng, Tráng Miệng, Đồ Uống).
--   5. Seeds 100 Products (20 products per category with realistic names, prices, descriptions, images).
--   Note: Dynamic operational data (Orders, Order Items, Sessions, KDS Tickets, Service Requests)
--   will be generated dynamically at runtime when scanning QR codes and using the application APIs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DDL: Ensure kitchen_tickets table exists if not previously created
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kitchen_tickets (
    kitchen_ticket_id  BIGSERIAL PRIMARY KEY,
    order_id           BIGINT       NOT NULL,
    order_item_id      BIGINT       NOT NULL UNIQUE,
    table_number       VARCHAR(255) NOT NULL,
    area_name          VARCHAR(255) DEFAULT NULL,
    product_id         BIGINT       NOT NULL,
    product_name       VARCHAR(255) NOT NULL,
    quantity           BIGINT       NOT NULL,
    note               VARCHAR(255) DEFAULT NULL,
    status             VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    assigned_cook_id   BIGINT       DEFAULT NULL,
    assigned_cook_name VARCHAR(255) DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_order ON kitchen_tickets(order_id);

-- -----------------------------------------------------------------------------
-- 2. SEED: USERS (10 Accounts across MANAGER, CASHIER, STAFF, KITCHEN)
-- Password for all accounts: admin123
-- BCrypt Hash: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a
-- -----------------------------------------------------------------------------
INSERT INTO users (user_id, username, password_hash, fullname, role, is_active, created_at, phone)
VALUES
    (1, 'admin',     '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Quản Lý Hệ Thống',   'MANAGER', true, CURRENT_TIMESTAMP, '0901234561'),
    (2, 'manager1',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Trần Văn Quản Lý',   'MANAGER', true, CURRENT_TIMESTAMP, '0901234562'),
    (3, 'cashier1',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Lê Thị Thu Ngân 1',  'CASHIER', true, CURRENT_TIMESTAMP, '0901234563'),
    (4, 'cashier2',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Phạm Văn Thu Ngân 2','CASHIER', true, CURRENT_TIMESTAMP, '0901234564'),
    (5, 'staff1',    '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Nguyễn Văn Phục Vụ 1','STAFF',   true, CURRENT_TIMESTAMP, '0901234565'),
    (6, 'staff2',    '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Hoàng Thị Phục Vụ 2','STAFF',   true, CURRENT_TIMESTAMP, '0901234566'),
    (7, 'staff3',    '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Vũ Văn Phục Vụ 3',   'STAFF',   true, CURRENT_TIMESTAMP, '0901234567'),
    (8, 'kitchen1',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Đỗ Văn Đầu Bếp 1',   'KITCHEN', true, CURRENT_TIMESTAMP, '0901234568'),
    (9, 'kitchen2',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Ngô Thị Đầu Bếp 2',  'KITCHEN', true, CURRENT_TIMESTAMP, '0901234569'),
    (10,'kitchen3',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', 'Bùi Văn Đầu Bếp 3',  'KITCHEN', true, CURRENT_TIMESTAMP, '0901234570')
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    fullname = EXCLUDED.fullname,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- -----------------------------------------------------------------------------
-- 3. SEED: TABLES (10 Restaurant Tables: Bàn 01 -> Bàn 10)
-- -----------------------------------------------------------------------------
INSERT INTO tables (table_id, table_name, qr_token, qr_url, is_active, table_status, creat_at)
VALUES
    (1,  'Bàn 01', 'qr_tok_table_01', 'http://localhost:5173/table/1?token=qr_tok_table_01', true, 'EMPTY', CURRENT_TIMESTAMP),
    (2,  'Bàn 02', 'qr_tok_table_02', 'http://localhost:5173/table/2?token=qr_tok_table_02', true, 'EMPTY', CURRENT_TIMESTAMP),
    (3,  'Bàn 03', 'qr_tok_table_03', 'http://localhost:5173/table/3?token=qr_tok_table_03', true, 'EMPTY', CURRENT_TIMESTAMP),
    (4,  'Bàn 04', 'qr_tok_table_04', 'http://localhost:5173/table/4?token=qr_tok_table_04', true, 'EMPTY', CURRENT_TIMESTAMP),
    (5,  'Bàn 05', 'qr_tok_table_05', 'http://localhost:5173/table/5?token=qr_tok_table_05', true, 'EMPTY', CURRENT_TIMESTAMP),
    (6,  'Bàn 06', 'qr_tok_table_06', 'http://localhost:5173/table/6?token=qr_tok_table_06', true, 'EMPTY', CURRENT_TIMESTAMP),
    (7,  'Bàn 07', 'qr_tok_table_07', 'http://localhost:5173/table/7?token=qr_tok_table_07', true, 'EMPTY', CURRENT_TIMESTAMP),
    (8,  'Bàn 08', 'qr_tok_table_08', 'http://localhost:5173/table/8?token=qr_tok_table_08', true, 'EMPTY', CURRENT_TIMESTAMP),
    (9,  'Bàn 09', 'qr_tok_table_09', 'http://localhost:5173/table/9?token=qr_tok_table_09', true, 'EMPTY', CURRENT_TIMESTAMP),
    (10, 'Bàn 10', 'qr_tok_table_10', 'http://localhost:5173/table/10?token=qr_tok_table_10', true, 'EMPTY', CURRENT_TIMESTAMP)
ON CONFLICT (table_id) DO UPDATE SET
    table_name = EXCLUDED.table_name,
    qr_token = EXCLUDED.qr_token,
    qr_url = EXCLUDED.qr_url,
    table_status = EXCLUDED.table_status;

SELECT setval('tables_table_id_seq', (SELECT MAX(table_id) FROM tables));

-- -----------------------------------------------------------------------------
-- 4. SEED: CATEGORIES (5 Catalogs)
-- -----------------------------------------------------------------------------
INSERT INTO categories (category_id, category_name)
VALUES
    (1, 'Khai Vị'),
    (2, 'Món Chính'),
    (3, 'Lẩu & Nướng'),
    (4, 'Tráng Miệng'),
    (5, 'Đồ Uống')
ON CONFLICT (category_id) DO UPDATE SET
    category_name = EXCLUDED.category_name;

SELECT setval('categories_category_id_seq', (SELECT MAX(category_id) FROM categories));

-- -----------------------------------------------------------------------------
-- 5. SEED: PRODUCTS (100 Products total: 20 Products per Category)
-- -----------------------------------------------------------------------------

-- 5.1 Category 1: Khai Vị (Products 1 -> 20)
INSERT INTO products (product_id, category_id, product_name, product_price, product_description, product_image_url, product_is_available)
VALUES
    (1, 1, 'Gỏi Cuốn Tôm Thịt', 45000, 'Gỏi cuốn tôm thịt tươi ngon kèm nước chấm tương đen đậu nạch chuẩn vị', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', true),
    (2, 1, 'Chả Giò Hải Sản Giòn Rụm', 65000, 'Chả giò nhân tôm mực chiên vàng giòn rụm chấm sốt mayonaise', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600', true),
    (3, 1, 'Nộm Bò Bóp Thấu', 85000, 'Thịt bò tái chanh trộn rau thơm, hành tây, chuối chát và khế chua', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600', true),
    (4, 1, 'Súp Cua Tóc Tiên Thượng Hạng', 55000, 'Súp cua nhiều thịt nạm cua tươi, trứng bách thảo và tóc tiên bổ dưỡng', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (5, 1, 'Salad Sốt Chanh Dây Phô Mai', 60000, 'Rau mầm tươi mát kết hợp hạt sốt chanh dây tươi và phô mai bào', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', true),
    (6, 1, 'Bánh Khọt Vũng Tàu', 50000, 'Bánh khọt tôm tươi giòn rụm ăn kèm rau sống và nước mắm chua ngọt', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', true),
    (7, 1, 'Khoai Tây Chiên Bơ Tỏi', 40000, 'Khoai tây bổ múi chiên giòn xóc bơ tỏi thơm lừng', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600', true),
    (8, 1, 'Gà Lắc Phô Mai Bột Ngô', 45000, 'Gà viên chiên xù lắc bột phô mai mặn ngọt đậm đà', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600', true),
    (9, 1, 'Chạo Tôm Bọc Mía Nướng', 75000, 'Tôm quết nhẵn bọc thân mía nướng than hoa thơm nức', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600', true),
    (10, 1, 'Nghêu Hấp Sả Ớt Thái', 70000, 'Nghêu tươi hấp sả ớt đậm đà nước dùng chua cay kiểu Thái', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600', true),
    (11, 1, 'Ốc Nhồi Hấp Gừng Lá Thốt Nốt', 80000, 'Ốc nhồi thịt giòn ngon hấp cùng gừng tươi và lá thốt nốt thơm phức', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', true),
    (12, 1, 'Súp Bào Ngư Hải Sâm', 150000, 'Súp bào ngư thượng hạng bổ dưỡng dành cho người sành ăn', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (13, 1, 'Chả Cá Lăng Hà Thành', 120000, 'Chả cá lăng ướp riềng mẻ ướp nướng chảo ăn kèm thì là bún tươi', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', true),
    (14, 1, 'Cánh Gà Chiên Nước Mắm', 75000, 'Cánh gà chiên giòn áo lớp sốt nước mắm tỏi ớt kẹo mặn ngọt', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600', true),
    (15, 1, 'Salmon Tartare Cá Hồi Tươi', 110000, 'Cá hồi Na Uy thái hạt lựu trộn bơ tươi và sốt ponzu kiểu Nhật', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', true),
    (16, 1, 'Đậu Hũ Chiên Giòn Tỏi Ớt', 35000, 'Đậu hũ non chiên giòn bên ngoài mềm mịn bên trong rắc muối tỏi ớt', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', true),
    (17, 1, 'Nem Nướng Nha Trang Đặc Biệt', 65000, 'Nem nướng mộc thơm phức ăn kèm bánh tráng giòn và nước chấm nếp', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', true),
    (18, 1, 'Bánh Kẹp Taco Hải Sản', 80000, 'Vỏ bánh giòn rụm kẹp tôm mực băm sốt salsa bơ chín', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600', true),
    (19, 1, 'Gỏi Ngó Sen Tôm Thịt', 75000, 'Ngó sen giòn sần sật trộn tôm luộc, thịt ba chỉ và giấm mắm chua ngọt', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600', true),
    (20, 1, 'Salad Lườn Vịt Hun Khói', 95000, 'Lườn vịt hun khói thái mỏng trộn rau mầm sốt dấm táo', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', true)
ON CONFLICT (product_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    product_name = EXCLUDED.product_name,
    product_price = EXCLUDED.product_price,
    product_description = EXCLUDED.product_description,
    product_image_url = EXCLUDED.product_image_url,
    product_is_available = EXCLUDED.product_is_available;

-- 5.2 Category 2: Món Chính (Products 21 -> 40)
INSERT INTO products (product_id, category_id, product_name, product_price, product_description, product_image_url, product_is_available)
VALUES
    (21, 2, 'Cơm Chiên Hải Sản Hoàng Gia', 120000, 'Cơm chiên hạt dẻo ngon với tôm mực tươi, trứng muối và hạt sen', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600', true),
    (22, 2, 'Bò Lúc Lắc Hạt Tiêu Xanh', 165000, 'Bò Úc thái khối mềm ngọt xào hành tây, ớt chuông và tiêu xanh', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', true),
    (23, 2, 'Sườn Cừu Nướng Sốt Rượu Vang', 280000, 'Sườn cừu nhập khẩu nướng mộc sốt tiêu đen rượu vang đỏ', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600', true),
    (24, 2, 'Cá Hồi Nướng Sốt Bơ Chanh', 250000, 'Cá hồi tươi nướng chảo áp chảo giữ độ mềm mọng cùng sốt bơ chanh', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600', true),
    (25, 2, 'Mỳ Ý Bò Bằm Bologna', 115000, 'Mỳ Spaghetti sốt cà chua thịt bò bằm Ý phủ phô mai Parmesan', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600', true),
    (26, 2, 'Vịt Quay Bắc Kinh Da Giòn', 350000, 'Nửa con vịt quay da giòn rụm kèm bánh tráng mỏng và sốt tương ngọt', 'https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?w=600', true),
    (27, 2, 'Tôm Hùm Sốt Phô Mai Đút Lò', 680000, 'Tôm hùm bông nửa con đút lò phô mai Mozzarella tan chảy', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600', true),
    (28, 2, 'Cơm Thố Bò Nướng Sốt Nhật', 130000, 'Cơm thố đá nóng giữ nhiệt với thịt bò Mỹ lát mỏng sốt Teriyaki', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600', true),
    (29, 2, 'Lườn Vịt Sốt Cam Pháp', 220000, 'Lườn vịt áp chảo da giòn thịt mềm kèm sốt cam tươi thơm lừng', 'https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?w=600', true),
    (30, 2, 'Gà Hấp Lá Chanh Nửa Con', 160000, 'Gà ta thả vườn thịt chắc hấp lá chanh chấm muối tiêu chanh ớt', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600', true),
    (31, 2, 'Cá Điêu Hồng Hấp Hong Kong', 210000, 'Cá điêu hồng nguyên con hấp xì dầu hành gừng chuẩn vị Quảng Đông', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', true),
    (32, 2, 'Mực Xào Sa Tế Cần Tây', 145000, 'Mực ống tươi giòn xào sa tế cay nồng đậm đà vị biển', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', true),
    (33, 2, 'Bò Thềm Đá Nướng Tiêu Đen', 230000, 'Thịt bò Mỹ nướng trên thềm đá nóng giữ trọn vị ngọt tự nhiên', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', true),
    (34, 2, 'Cơm Tấm Sườn Bì Chả Đặc Biệt', 75000, 'Cơm tấm hạt dẻo sườn nướng mỡ hành bì chả trứng ốp la', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600', true),
    (35, 2, 'Phở Bò Tái Nạm Đặc Biệt', 85000, 'Bát phở bò nước dùng ninh xương 24h đậm đà thịt tái nạm tươi ngon', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600', true),
    (36, 2, 'Bún Chả Hà Nội Truyền Thống', 70000, 'Bún chả thịt nướng than hoa mắm chấm đu đủ giòn ngon', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', true),
    (37, 2, 'Bánh Đa Cua Hải Phòng', 75000, 'Bánh đa đỏ cua đồng chả lá lốt thơm lừng đậm đà miền biển', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', true),
    (38, 2, 'Miến Xào Cua Cà Mau', 160000, 'Miến phơi sương xào thịt cua tươi ngon đậm vị không bị nát', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600', true),
    (39, 2, 'Bò Nướng Y Kiểu Mông Cổ', 190000, 'Thịt bò nướng nguyên miếng trên ngọn lửa lớn mặn ngọt đậm đà', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', true),
    (40, 2, 'Cơm Tay Cầm Hải Sản Thố Đất', 140000, 'Cơm thố nướng có lớp cháy giòn rụm bên dưới trộn tôm mực sa tế', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600', true)
ON CONFLICT (product_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    product_name = EXCLUDED.product_name,
    product_price = EXCLUDED.product_price,
    product_description = EXCLUDED.product_description,
    product_image_url = EXCLUDED.product_image_url,
    product_is_available = EXCLUDED.product_is_available;

-- 5.3 Category 3: Lẩu & Nướng (Products 41 -> 60)
INSERT INTO products (product_id, category_id, product_name, product_price, product_description, product_image_url, product_is_available)
VALUES
    (41, 3, 'Lẩu Thái Hải Sản Chua Cay', 350000, 'Nước lẩu TomYum béo ngậy chua cay kèm tôm càng, mực, nghêu và nấm', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (42, 3, 'Lẩu Bò Ribeye Nấm Thiên Nhiên', 420000, 'Lẩu bò Mỹ cao cấp nhúng nấm trâm vàng, nấm kim châm thanh ngọt', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', true),
    (43, 3, 'Lẩu Riêu Cua Đồng Sườn Sụn', 380000, 'Nước lẩu riêu cua béo ngậy thơm mùi giấm mẻ ăn kèm sườn sụn và bắp bò', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (44, 3, 'Lẩu Cá Tầm Sapa Thượng Hạng', 480000, 'Cá tầm tươi cắt lát nhúng lẩu măng chua ngọt thịt giòn ngọt sần sật', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', true),
    (45, 3, 'Lẩu Tứ Xuyên Siêu Cay', 390000, 'Lẩu 2 ngăn cay tê nồng vị ớt Tứ Xuyên và thảo mộc đậm đà', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', true),
    (46, 3, 'Ba Chỉ Bò Mỹ Nướng Yakiniku', 155000, 'Ba chỉ bò Mỹ thái mỏng cuộn nướng sốt mặn ngọt chuẩn vị Nhật', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', true),
    (47, 3, 'Dẻ Sườn Bò Mỹ Sốt BBQ', 210000, 'Dẻ sườn ướp sốt BBQ đậm đà nướng than hoa thơm lừng', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600', true),
    (48, 3, 'Nầm Heo Nướng Sa Tế', 135000, 'Nầm heo ướp sa tế nướng thơm giòn sần sật', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600', true),
    (49, 3, 'Mực Lá Nướng Sa Tế Nguyên Con', 185000, 'Mực lá béo ngậy nướng sa tế cay nồng giòn ngọt', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', true),
    (50, 3, 'Tôm Càng Nướng Mỡ Hành', 195000, 'Tôm càng xanh nướng mỡ hành rắc đậu phụng béo ngậy', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600', true),
    (51, 3, 'Bạch Tuộc Nướng Sa Tế Giòn Rụm', 160000, 'Bạch Tuộc baby nướng sa tế muối ớt xanh ngon ngất ngây', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600', true),
    (52, 3, 'Sườn Heo Bánh Xe BBQ', 240000, 'Bảng sườn heo nướng ngập sốt bơ tỏi mềm róc xương', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600', true),
    (53, 3, 'Gà Nướng Cơm Lam Tây Nguyên', 290000, 'Gà nướng lu than hồng ăn kèm ống cơm lam dẻo thơm', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600', true),
    (54, 3, 'Lẩu Nấm Bổ Dưỡng Chay', 290000, 'Nước dùng nấm thuần chay ngọt tự nhiên kèm 8 loại nấm quý', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (55, 3, 'Lẩu Cháo Chim Trĩ Hạt Sen', 450000, 'Cháo ninh nhừ sánh mịn đậm đà nhúng chim trĩ và rau đắng', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (56, 3, 'Bò Mỹ Cuộn Nấm Kim Châm Nướng', 145000, 'Bò Mỹ nướng thơm mềm bọc nấm kim châm ngọt mọng', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', true),
    (57, 3, 'Thăn Ngoại Bò Úc Nướng Stone', 320000, 'Thịt thăn nướng đá nóng xèo xèo dậy hương thơm ngút ngàn', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', true),
    (58, 3, 'Lẩu Mắm Miền Tây Đậm Đà', 360000, 'Nước lẩu mắm cá linh cá sặc đậm đà ăn kèm 15 loại rau đồng quê', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true),
    (59, 3, 'Lẩu Gà Lá É Phú Yên', 340000, 'Nước lẩu gà ngọt thanh kết hợp vị cay ấm nồng đặc trưng của lá é', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600', true),
    (60, 3, 'Lẩu Vịt Om Sấu Hà Nội', 330000, 'Thịt vịt béo ngậy om sấu chua thanh nhẹ ăn kèm khoai môn bún tươi', 'https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?w=600', true)
ON CONFLICT (product_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    product_name = EXCLUDED.product_name,
    product_price = EXCLUDED.product_price,
    product_description = EXCLUDED.product_description,
    product_image_url = EXCLUDED.product_image_url,
    product_is_available = EXCLUDED.product_is_available;

-- 5.4 Category 4: Tráng Miệng (Products 61 -> 80)
INSERT INTO products (product_id, category_id, product_name, product_price, product_description, product_image_url, product_is_available)
VALUES
    (61, 4, 'Bánh Tiramisu Cacao Ý', 55000, 'Bánh Tiramisu mềm mịn thơm nồng hương cà phê và cacao cao cấp', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', true),
    (62, 4, 'Cheesecake Chanh Dây', 50000, 'Bánh phô mai nướng kết hợp lớp mứt chanh dây chua ngọt hài hòa', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600', true),
    (63, 4, 'Chè Dừa Dầm Hải Phòng', 40000, 'Chè dừa sợi tươi, thạch dừa và nước cốt dừa béo ngậy mát lạnh', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', true),
    (64, 4, 'Kem Bơ Đà Lạt Béo Ngậy', 45000, 'Kem bơ sáp tươi Đà Lạt xay mịn ăn kèm 1 viên kem dừa thơm ngậy', 'https://images.unsplash.com/photo-1567206563064-6f60f4006501?w=600', true),
    (65, 4, 'Chè Bưởi An Giang', 35000, 'Cùi bưởi giòn sần sật bọc bột năng kết hợp đậu xanh ninh kỹ', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', true),
    (66, 4, 'Bánh Flan Caramel Vani', 30000, 'Bánh flan trứng sữa mềm mịn phủ lớp đắng ngọt caramel', 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600', true),
    (67, 4, 'Panna Cotta Dâu Tây Pháp', 45000, 'Kem kem kem mềm mượt phủ sốt dâu tươi chua ngọt nhẹ nhàng', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600', true),
    (68, 4, 'Trái Cây Đĩa Thập Cẩm Mùa', 75000, 'Đĩa hoa quả tươi ngon theo mùa (Dưa hấu, Xoài, Thơm, Nho, Táo)', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600', true),
    (69, 4, 'Bánh Mousse Socola Đắng', 55000, 'Bánh mousse socola 70% cacao vị đậm đà không quá ngọt', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600', true),
    (70, 4, 'Chè Hạt Sen Long Nhãn', 45000, 'Chè hạt sen Đồng Tháp lồng nhãn Hưng Yên thanh mát bổ dưỡng', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', true),
    (71, 4, 'Kem Dừa Côn Đảo Nguyên Trái', 60000, 'Kem dừa mát lạnh đựng trong gáo dừa rắc dừa khô và đậu phụng', 'https://images.unsplash.com/photo-1567206563064-6f60f4006501?w=600', true),
    (72, 4, 'Bánh Chuối Nướng Sốt Vani', 35000, 'Bánh chuối dẻo thơm nướng mật dừa kèm sốt vani ngậy', 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600', true),
    (73, 4, 'Sữa Chua Nếp Cẩm Tây Bắc', 35000, 'Sữa chua nhà làm dẻo mịn trộn nếp cẩm u chín tới bùi ngọt', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600', true),
    (74, 4, 'Bánh Su Kem Vani Giòn', 30000, 'Bánh choux vỏ giòn tan nhân kem tươi vani mát lạnh', 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600', true),
    (75, 4, 'Crepe Sầu Riêng Tươi', 55000, 'Bánh crepe lá dứa cuộn nhân thịt sầu riêng Ri6 ngọt lịm', 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600', true),
    (76, 4, 'Chè Thái Sầu Riêng Thập Cẩm', 50000, 'Chè Thái ngập tràn mít, thạch giòn, hạt thốt nốt và sầu riêng tươi', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', true),
    (77, 4, 'Kem Matcha Trà Xanh Nhật', 45000, 'Kem trà xanh Matcha Uji nhập khẩu đậm đà vị chát nhẹ hậu ngọt', 'https://images.unsplash.com/photo-1567206563064-6f60f4006501?w=600', true),
    (78, 4, 'Tart Trái Cây Tươi Dừa Phô Mai', 50000, 'Bánh tart đế giòn thơm bơ phủ dâu tươi và việt quất', 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600', true),
    (79, 4, 'Soufflé Socola Nóng Chảy', 65000, 'Bánh nướng phồng xốp nhân socola tan chảy ấm nóng ngon khó cưỡng', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600', true),
    (80, 4, 'Thạch Dừa Bến Tre Nguyên Trái', 40000, 'Thạch dừa xiêm nguyên trái thanh mát giữ nguyên vị ngọt tự nhiên', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', true)
ON CONFLICT (product_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    product_name = EXCLUDED.product_name,
    product_price = EXCLUDED.product_price,
    product_description = EXCLUDED.product_description,
    product_image_url = EXCLUDED.product_image_url,
    product_is_available = EXCLUDED.product_is_available;

-- 5.5 Category 5: Đồ Uống (Products 81 -> 100)
INSERT INTO products (product_id, category_id, product_name, product_price, product_description, product_image_url, product_is_available)
VALUES
    (81, 5, 'Trà Đào Cam Sả Tươi', 45000, 'Trà đào vị ngọt thanh dầm miếng đào giòn thơm hương cam sả', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600', true),
    (82, 5, 'Trà Vải Hạt Chia Sảng Khoái', 45000, 'Trà nhài thanh khiết kết hợp quả vải mọng nước và hạt chia bổ dưỡng', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', true),
    (83, 5, 'Sinh Tố Bơ Đắc Lắc', 50000, 'Bơ dốt Đắc Lắc xay sữa đặc béo ngậy thơm ngon', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600', true),
    (84, 5, 'Nước Ép Dưa Hấu Tươi Nguyên Chất', 40000, 'Dưa hấu đỏ ép tươi không đường thanh nhiệt ngày hè', 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600', true),
    (85, 5, 'Cà Phê Muối Xứ Huế', 35000, 'Cà phê phin đậm đà kết hợp lớp kem mặn béo ngậy đặc sản Huế', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', true),
    (86, 5, 'Cà Phê Sữa Đá Sài Gòn', 30000, 'Cà phê Robusta đậm đặc pha sữa đặc mặn ngọt chuẩn vị miền Nam', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600', true),
    (87, 5, 'Trà Sữa Matcha Trân Châu', 48000, 'Trà sữa matcha thơm đậm béo nhẹ kèm trân châu đường đen dai giòn', 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600', true),
    (88, 5, 'Bia Thủ Công Craft IPA', 85000, 'Bia tươi thủ công hương hoa cỏ nhiệt đới độ đắng nhẹ tinh tế', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', true),
    (89, 5, 'Rượu Vang Đỏ Merlot Nhập Khẩu', 450000, 'Chai rượu vang đỏ Pháp hương quả mọng quyến rũ 750ml', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600', true),
    (90, 5, 'Rượu Soju Hàn Quốc Truyền Thống', 95000, 'Chai Soju Jinro Hàn Quốc 360ml thích hợp uống kèm món nướng lẩu', 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600', true),
    (91, 5, 'Nước Dừa Tươi Bến Tre nguyên trái', 35000, 'Dừa xiêm xanh ngọt mát dầm đá mát lạnh', 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600', true),
    (92, 5, 'Mojito Bạc Hà Chanh Sảng Khoái', 55000, 'Cocktail không cồn chanh tươi bạc hà giã đập soda sảng khoái', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600', true),
    (93, 5, 'Soda Việt Quất Đá Tuyết', 45000, 'Soda mứt việt quất chua ngọt dầm đá tuyết mát lạnh', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', true),
    (94, 5, 'Trà Oolong Macchiato', 48000, 'Trà Oolong đậm vị đậy trên lớp váng sữa Macchiato mặn béo', 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600', true),
    (95, 5, 'Sinh Tố Mãng Cầu Gai', 50000, 'Mãng cầu gai tươi xay sữa đặc chua chua bùi bùi thơm ngon', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600', true),
    (96, 5, 'Nước Ép Táo Cà Rốt Nguyên Chất', 45000, 'Nước ép trái cây tươi giàu vitamin A C làm đẹp da', 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600', true),
    (97, 5, 'Kombucha Dâu Tây Bổ Dưỡng', 55000, 'Trà lên mặn Kombucha vị dâu tây tự nhiên tốt cho hệ tiêu hóa', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', true),
    (98, 5, 'Cà Phê Trứng Hà Nội', 45000, 'Cà phê nốt béo bớp lọt lòng đỏ trứng gà đánh bông mịn ngậy thơm', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', true),
    (99, 5, 'Bia Heineken Silver Lon 330ml', 35000, 'Bia Heineken Silver lon ướp lạnh mát lạnh sảng khoái', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', true),
    (100, 5, 'Nước Suối Khoáng San Pellegrino', 60000, 'Chai nước khoáng có gas nhập khẩu Ý 500ml cao cấp', 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600', true)
ON CONFLICT (product_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    product_name = EXCLUDED.product_name,
    product_price = EXCLUDED.product_price,
    product_description = EXCLUDED.product_description,
    product_image_url = EXCLUDED.product_image_url,
    product_is_available = EXCLUDED.product_is_available;

SELECT setval('products_product_id_seq', (SELECT MAX(product_id) FROM products));

-- =============================================================================
-- END OF MIGRATION SCRIPT V4
-- =============================================================================
