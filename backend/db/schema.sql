-- ═══════════════════════════════════════════════════════
-- AI LIVE-COMMERCE TOOL - DATABASE SCHEMA (PostgreSQL)
-- ═══════════════════════════════════════════════════════

-- Tạo database
-- CREATE DATABASE ai_live_tool;

-- Extension cho UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────
-- 1. shops - Quản lý cửa hàng / Khách hàng SaaS
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'Free', -- Free, Pro, Enterprise
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────
-- 2. livestream_sessions - Quản lý phiên Live
-- ──────────────────────────────────────────────────────
CREATE TYPE session_status AS ENUM ('Active', 'Ended');

CREATE TABLE IF NOT EXISTS livestream_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL, -- "Tiktok" | "Shopee"
    platform_live_id VARCHAR(255),
    status session_status DEFAULT 'Active',
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE INDEX idx_sessions_shop ON livestream_sessions(shop_id);
CREATE INDEX idx_sessions_status ON livestream_sessions(status);

-- ──────────────────────────────────────────────────────
-- 3. customers - Lưu trữ tệp khách hàng / CRM
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(20) NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    nickname VARCHAR(255),
    profile_link TEXT,
    total_interactions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_customers_platform_user ON customers(platform, platform_user_id);

-- ──────────────────────────────────────────────────────
-- 4. chat_logs - Lưu toàn bộ bình luận (High Write)
-- ──────────────────────────────────────────────────────
CREATE TYPE ai_label_type AS ENUM ('HOT', 'WARM', 'COLD');

CREATE TABLE IF NOT EXISTS chat_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES livestream_sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    ai_label ai_label_type NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_logs_label ON chat_logs(ai_label);
CREATE INDEX idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX idx_chat_logs_created ON chat_logs(created_at);

-- ──────────────────────────────────────────────────────
-- 5. leads - Khách hàng tiềm năng (HOT/WARM only)
-- ──────────────────────────────────────────────────────
CREATE TYPE lead_status AS ENUM ('New', 'Contacting', 'Closed', 'Ignored');

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_log_id BIGINT REFERENCES chat_logs(id) ON DELETE CASCADE,
    status lead_status DEFAULT 'New',
    product_intent VARCHAR(255),
    staff_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);

-- ──────────────────────────────────────────────────────
-- Dữ liệu mẫu: Shop mặc định
-- ──────────────────────────────────────────────────────
INSERT INTO shops (shop_name, subscription_plan)
VALUES ('Mẹ Bin Store', 'Pro')
ON CONFLICT DO NOTHING;
