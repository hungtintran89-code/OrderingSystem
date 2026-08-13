-- =============================================================================
-- DATABASE MIGRATION SCRIPT FOR ORDERING SYSTEM
-- Engine: PostgreSQL
-- Framework: Flyway / Spring Data JPA
-- Modules: Auth, Catalog, Table, Order, ServiceRequest
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MODULE: AUTH
-- Table: users
-- Entity: ordersystem.backend.modules.auth.entity.User
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
                                     user_id       BIGSERIAL PRIMARY KEY,
                                     username      VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fullname      VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    phone         VARCHAR(20)  DEFAULT NULL
    );

-- Index tối ưu hóa tìm kiếm tài khoản theo vai trò và trạng thái hoạt động
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);


-- -----------------------------------------------------------------------------
-- 2. MODULE: CATALOG
-- Tables: categories, products
-- Entities: CategoryEntity, ProductEntity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
                                          category_id   BIGSERIAL PRIMARY KEY,
                                          category_name VARCHAR(255) NOT NULL UNIQUE
    );

CREATE TABLE IF NOT EXISTS products (
                                        product_id           BIGSERIAL PRIMARY KEY,
                                        product_name         VARCHAR(255) NOT NULL,
    product_price        BIGINT       NOT NULL,
    product_image_url    VARCHAR(500) DEFAULT NULL,
    product_description  TEXT         DEFAULT NULL,
    product_is_available BOOLEAN      NOT NULL DEFAULT TRUE,
    category_id          BIGINT       NOT NULL,
    CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories(category_id)
    ON DELETE CASCADE
    );

-- Index tối ưu truy vấn danh sách món theo danh mục và món khả dụng trên menu
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(product_is_available);


-- -----------------------------------------------------------------------------
-- 3. MODULE: TABLE
-- Tables: tables, table_sessions
-- Entities: RestaurantTableEntity, TableSessionEntity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables (
                                      table_id     BIGSERIAL PRIMARY KEY,
                                      table_name   VARCHAR(255) NOT NULL UNIQUE,
    qr_token     VARCHAR(255) NOT NULL UNIQUE,
    qr_url       VARCHAR(500) NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    table_status VARCHAR(50)  NOT NULL DEFAULT 'EMPTY',
    creat_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS table_sessions (
                                              table_session_id BIGSERIAL PRIMARY KEY,
                                              table_name       VARCHAR(255) NOT NULL,
    session_token    VARCHAR(255) NOT NULL,
    table_id         BIGINT       NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    started_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at         TIMESTAMP    DEFAULT NULL,
    CONSTRAINT fk_table_sessions_table
    FOREIGN KEY (table_id)
    REFERENCES tables(table_id)
    ON DELETE CASCADE
    );

-- Index tối ưu tra cứu session theo bàn, token phiên và trạng thái (ACTIVE/CLOSED)
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_token ON table_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_table_sessions_status ON table_sessions(status);


-- -----------------------------------------------------------------------------
-- 4. MODULE: ORDER
-- Tables: orders, order_items
-- Entities: OrderEntity, OrderItemEntity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
                                      id               BIGSERIAL PRIMARY KEY,
                                      order_code       VARCHAR(255) NOT NULL UNIQUE,
    table_session_id BIGINT       NOT NULL,
    total_amount     BIGINT       NOT NULL DEFAULT 0,
    status           VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_table_session
    FOREIGN KEY (table_session_id)
    REFERENCES table_sessions(table_session_id)
    ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS order_items (
                                           order_item_id     BIGSERIAL PRIMARY KEY,
                                           order_id          BIGINT       NOT NULL,
                                           product_id        BIGINT       NOT NULL,
                                           quantity          BIGINT       NOT NULL,
                                           price             BIGINT       NOT NULL,
                                           total_price       BIGINT       NOT NULL,
                                           note              VARCHAR(255) DEFAULT NULL,
    created_by_thread BIGINT       NOT NULL,
    CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id)
    REFERENCES products(product_id)
    ON DELETE RESTRICT
    );

-- Index tối ưu hiển thị KDS (Kitchen Display System) và tra cứu chi tiết đơn hàng
CREATE INDEX IF NOT EXISTS idx_orders_table_session_id ON orders(table_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);


-- -----------------------------------------------------------------------------
-- 5. MODULE: SERVICEREQUEST
-- Table: service_requests
-- Entity: ServiceRequestEntity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requests (
                                                request_id     BIGSERIAL PRIMARY KEY,
                                                table_id       BIGINT       NOT NULL,
                                                table_name     VARCHAR(255) NOT NULL,
    session_id     VARCHAR(255) NOT NULL,
    type           VARCHAR(50)  NOT NULL,
    request_status VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    completed_at   TIMESTAMP    DEFAULT NULL
    );

-- Index phục vụ màn hình notification/điều phối phục vụ của nhân viên
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_service_requests_table_id ON service_requests(table_id);
