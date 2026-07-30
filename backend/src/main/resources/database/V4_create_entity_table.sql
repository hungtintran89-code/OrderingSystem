-- ============================================================
-- 1. BẢNG BÀN ĂN (restaurant_tables)
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
                                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                 table_number VARCHAR(255) NOT NULL UNIQUE,
    area_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'EMPTY',
    qr_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ============================================================
-- 2. BẢNG PHIÊN CHUNG CỦA BÀN (table_sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS table_sessions (
                                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              table_session_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    table_id BIGINT NOT NULL,
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    CONSTRAINT fk_session_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE
    );

-- ============================================================
-- 3. BẢNG MÓN ĂN & TOPPING (products & product_option)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        name VARCHAR(255) NOT NULL,
    price BIGINT NOT NULL,
    image_url VARCHAR(500),
    description TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    category_id BIGINT
    );

CREATE TABLE IF NOT EXISTS product_option (
                                              product_option_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              name VARCHAR(255) NOT NULL,
    extra_price BIGINT NOT NULL DEFAULT 0
    );

-- ============================================================
-- 4. BẢNG HÓA ĐƠN TỔNG (orderEntities)
-- ============================================================
CREATE TABLE IF NOT EXISTS orderEntities (
                                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                      order_code VARCHAR(255) NOT NULL,
    table_session_id BIGINT NOT NULL,
    total_amount DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_order_session FOREIGN KEY (table_session_id) REFERENCES table_sessions(id) ON DELETE CASCADE
    );

-- ============================================================
-- 5. BẢNG CHI TIẾT MÓN ĂN (order_item)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_item (
                                          order_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          order_id BIGINT NOT NULL,
                                          product_id BIGINT NOT NULL,
                                          quantity BIGINT NOT NULL,
                                          price BIGINT NOT NULL,
                                          item_price BIGINT NOT NULL DEFAULT 0,
                                          total_price BIGINT NOT NULL DEFAULT 0,
                                          note VARCHAR(500),
    created_by_thread VARCHAR(255) NOT NULL,
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orderEntities(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
    );

-- ============================================================
-- 6. BẢNG TRUNG GIANG TOPPING ĐƯỢC CHỌN (order_item_selected_options)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_item_selected_options (
                                                           order_item_id BIGINT NOT NULL,
                                                           product_option_id BIGINT NOT NULL,
                                                           PRIMARY KEY (order_item_id, product_option_id),
    CONSTRAINT fk_selected_item FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id) ON DELETE CASCADE,
    CONSTRAINT fk_selected_option FOREIGN KEY (product_option_id) REFERENCES product_option(product_option_id)
    );