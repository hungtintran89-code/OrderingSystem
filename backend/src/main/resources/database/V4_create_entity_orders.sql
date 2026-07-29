-- Dùng cho PostgreSQL
CREATE TABLE IF NOT EXISTS products (
                                        id BIGSERIAL PRIMARY KEY,
                                        name VARCHAR(255) NOT NULL,
    price BIGINT NOT NULL,
    image_url VARCHAR(500),
    description TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    category_id BIGINT NOT NULL
    );

CREATE TABLE IF NOT EXISTS orders (
                                      id BIGSERIAL PRIMARY KEY,
                                      order_code VARCHAR(255) NOT NULL UNIQUE,
    table_session_id BIGINT NOT NULL,
    total_amount BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS order_items (
                                           order_item_id BIGSERIAL PRIMARY KEY,
                                           order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity BIGINT NOT NULL DEFAULT 1,
    price BIGINT NOT NULL DEFAULT 0,
    item_price BIGINT NOT NULL DEFAULT 0,
    total_price BIGINT NOT NULL DEFAULT 0,
    note VARCHAR(255),
    created_by_thread VARCHAR(255) NOT NULL
    );