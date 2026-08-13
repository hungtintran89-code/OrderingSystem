-- Migration V14: Seed Active Kitchen Tickets and Sample Orders for KDS Testing
-- Ensures PostgreSQL Database has real active kitchen tickets for the Kitchen display

-- 1. Ensure sample table sessions exist using existing tables or fallback
INSERT INTO table_sessions (table_session_id, table_name, session_token, table_id, status)
VALUES
    (1001, 'Bàn 01', 'sess-01', COALESCE((SELECT table_id FROM tables WHERE table_name = 'Bàn 01' LIMIT 1), 1), 'ACTIVE'),
    (1002, 'Bàn 02', 'sess-02', COALESCE((SELECT table_id FROM tables WHERE table_name = 'Bàn 02' LIMIT 1), 1), 'ACTIVE'),
    (1003, 'Bàn 04', 'sess-04', COALESCE((SELECT table_id FROM tables WHERE table_name = 'Bàn 04' LIMIT 1), 1), 'ACTIVE')
ON CONFLICT (table_session_id) DO NOTHING;

-- 2. Insert Sample Orders
INSERT INTO orders (id, order_code, table_session_id, total_amount, status, created_at)
VALUES
    (1001, 'ORD-1001', 1001, 150000, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    (1002, 'ORD-1002', 1002, 240000, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
    (1003, 'ORD-1003', 1003, 190000, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Sample Order Items
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, price, total_price, note, created_by_thread)
VALUES
    (5001, 1001, 1, 2, 65000, 130000, 'Tái chín, nhiều hành', 1),
    (5002, 1001, 81, 1, 45000, 45000, 'Ít đường, nhiều đá', 1),
    (5003, 1002, 21, 1, 180000, 180000, 'Chín vừa (Medium Rare)', 1),
    (5004, 1002, 99, 2, 35000, 70000, 'Ướp lạnh', 1),
    (5005, 1003, 2, 1, 60000, 60000, 'Bò chín', 1)
ON CONFLICT (order_item_id) DO NOTHING;

-- 4. Insert Sample Kitchen Tickets into kitchen_tickets table
INSERT INTO kitchen_tickets (kitchen_ticket_id, order_id, order_item_id, table_number, area_name, product_id, product_name, quantity, note, status)
VALUES
    (1, 1001, 5001, 'Bàn 01', 'Tầng 1', 1, 'Phở Bò Đặc Biệt (Bát Lớn)', 2, 'Tái chín, nhiều hành', 'PENDING'),
    (2, 1001, 5002, 'Bàn 01', 'Tầng 1', 81, 'Trà Đào Cam Sả Tươi', 1, 'Ít đường, nhiều đá', 'PENDING'),
    (3, 1002, 5003, 'Bàn 02', 'Tầng 1', 21, 'Bò Nướng Tảng Sốt Tiêu Đen', 1, 'Chín vừa (Medium Rare)', 'PENDING'),
    (4, 1002, 5004, 'Bàn 02', 'Tầng 1', 99, 'Bia Heineken Silver Lon 330ml', 2, 'Ướp lạnh', 'PENDING'),
    (5, 1003, 5005, 'Bàn 04', 'Tầng 2', 2, 'Phở Gà Tái Nương', 1, 'Bò chín', 'PENDING')
ON CONFLICT (kitchen_ticket_id) DO NOTHING;

SELECT setval('kitchen_tickets_kitchen_ticket_id_seq', (SELECT COALESCE(MAX(kitchen_ticket_id), 1) FROM kitchen_tickets));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
SELECT setval('order_items_order_item_id_seq', (SELECT COALESCE(MAX(order_item_id), 1) FROM order_items));
