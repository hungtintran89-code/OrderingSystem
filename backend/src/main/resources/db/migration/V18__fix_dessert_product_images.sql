-- V18: Fix dessert product images with unique and working Unsplash URLs
-- Update products in category 4 (Tráng Miệng)

-- 1. Kem Bơ Đà Lạt Béo Ngậy (product_id = 64) - Was using broken URL
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600' 
WHERE product_id = 64;

-- 2. Chè Bưởi An Giang (product_id = 65) - Was duplicate of Chè Dừa Dầm
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600' 
WHERE product_id = 65;

-- 3. Chè Hạt Sen Long Nhãn (product_id = 70) - Was duplicate of Chè Dừa Dầm
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600' 
WHERE product_id = 70;

-- 4. Kem Dừa Côn Đảo Nguyên Trái (product_id = 71) - Was using broken URL
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1534706936160-d5ee67737049?w=600' 
WHERE product_id = 71;

-- 5. Bánh Chuối Nướng Sốt Vani (product_id = 72) - Was duplicate of Bánh Flan
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1567982047351-76b6f93e38ee?w=600' 
WHERE product_id = 72;

-- 6. Sữa Chua Nếp Cẩm Tây Bắc (product_id = 73) - Was duplicate of Panna Cotta
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1571244856341-4f3dd95db36e?w=600' 
WHERE product_id = 73;

-- 7. Bánh Su Kem Vani Giòn (product_id = 74) - Was duplicate of Bánh Flan
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1600431521340-491eca880813?w=600' 
WHERE product_id = 74;

-- 8. Chè Thái Sầu Riêng Thập Cẩm (product_id = 76) - Was duplicate of Chè Dừa Dầm
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600' 
WHERE product_id = 76;

-- 9. Kem Matcha Trà Xanh Nhật (product_id = 77) - Was using broken URL
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600' 
WHERE product_id = 77;

-- 10. Tart Trái Cây Tươi Dừa Phô Mai (product_id = 78) - Was duplicate of Crepe Sầu Riêng
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600' 
WHERE product_id = 78;

-- 11. Soufflé Socola Nóng Chảy (product_id = 79) - Was duplicate of Bánh Mousse
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600' 
WHERE product_id = 79;

-- 12. Thạch Dừa Bến Tre Nguyên Trái (product_id = 80) - Was duplicate of Chè Dừa Dầm
UPDATE products 
SET product_image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' 
WHERE product_id = 80;
