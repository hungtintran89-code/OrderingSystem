-- Migration V10: Ensure default menu categories exist in database
INSERT INTO categories (category_name)
VALUES 
    ('Khai Vị'),
    ('Món Chính'),
    ('Lẩu & Nướng'),
    ('Tráng Miệng'),
    ('Đồ Uống')
ON CONFLICT (category_name) DO NOTHING;
