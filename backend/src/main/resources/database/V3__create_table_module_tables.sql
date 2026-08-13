-- Migration V3: Tạo các bảng cho module table (tables và table_sessions)

CREATE TABLE IF NOT EXISTS tables (
                                      table_id BIGSERIAL PRIMARY KEY,
                                      table_name VARCHAR(255) NOT NULL UNIQUE,
    qr_token VARCHAR(255) NOT NULL UNIQUE,
    qr_url VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    creat_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS table_sessions (
                                              table_session_id BIGSERIAL PRIMARY KEY,
                                              session_token VARCHAR(255) NOT NULL,
    table_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_table_sessions_table FOREIGN KEY (table_id) REFERENCES tables(table_id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_status ON table_sessions(status);