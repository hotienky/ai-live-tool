import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { scryptSync, randomBytes } from 'node:crypto'

/**
 * Hash password using Node.js scrypt — matches AdonisJS scrypt driver PHC format.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `$scrypt$n=16384,r=8,p=1$${salt.toString('base64').replace(/=/g, '')}$${derived.toString('base64').replace(/=/g, '')}`
}

/**
 * TenantService — Manages tenant lifecycle: create, migrate, seed, suspend, delete.
 */
export default class TenantService {
  /**
   * Create a new tenant: insert into master DB + dispatch provisioning job.
   * The actual DB creation happens in the queue worker.
   */
  static async createTenant(data: {
    name: string
    slug: string
    ownerEmail: string
    ownerName?: string
    ownerPassword?: string
    plan?: string
  }) {
    const dbName = `tenant_${data.slug}`

    // 1. Insert into master DB with status 'provisioning'
    const [tenant] = await db.connection('master')
      .table('tenants')
      .insert({
        name: data.name,
        slug: data.slug,
        db_name: dbName,
        owner_email: data.ownerEmail,
        owner_name: data.ownerName || data.name,
        plan: data.plan || 'free',
        status: 'provisioning',
      })
      .returning('*')

    // 2. Dispatch queue job for DB creation
    const { dispatch } = await import('#services/queue_service')
    await dispatch('create-tenant-db', {
      slug: data.slug,
      dbName,
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName || data.name,
      ownerPassword: data.ownerPassword,
    })

    return tenant
  }

  /**
   * Seed the owner user into a tenant's database.
   * Called by the create-tenant-db job.
   */
  static async seedOwner(slug: string, dbName: string, owner: {
    email: string
    name: string
    password: string
  }) {
    const hashedPassword = await hash.make(owner.password)
    const connectionName = `seed_owner_${slug}`
    db.manager.patch(connectionName, {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: dbName,
      },
    })
    const conn = db.connection(connectionName)
    await conn.rawQuery(
      `INSERT INTO users (name, full_name, email, password, role)
       VALUES (?, ?, ?, ?, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [owner.name, owner.name, owner.email, hashedPassword]
    )
    await db.manager.close(connectionName)
  }

  /**
   * Run migrations on a tenant's database
   */
  static async migrateTenant(slug: string, dbName?: string) {
    if (!dbName) {
      const tenant = await db.connection('master')
        .from('tenants')
        .where('slug', slug)
        .first()
      if (!tenant) throw new Error(`Tenant ${slug} not found`)
      dbName = tenant.db_name
    }

    // Run tenant schema SQL via raw queries on the tenant DB
    const connectionName = `migrate_${slug}`
    db.manager.patch(connectionName, {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: dbName,
      },
    })

    const conn = db.connection(connectionName)

    // Create all tenant tables
    await conn.rawQuery(TENANT_SCHEMA)

    // Disconnect after migration
    await db.manager.close(connectionName)

    return true
  }

  /**
   * Seed sample data for a tenant
   */
  static async seedTenant(slug: string) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .first()
    if (!tenant) throw new Error(`Tenant ${slug} not found`)

    const connectionName = `seed_${slug}`
    db.manager.patch(connectionName, {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: tenant.db_name,
      },
    })

    const conn = db.connection(connectionName)
    await conn.rawQuery(TENANT_SEED_DATA)
    await db.manager.close(connectionName)

    return true
  }

  /**
   * Suspend a tenant
   */
  static async suspendTenant(slug: string) {
    return db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .update({ status: 'suspended', updated_at: new Date() })
  }

  /**
   * Activate a tenant
   */
  static async activateTenant(slug: string) {
    return db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .update({ status: 'active', updated_at: new Date() })
  }

  /**
   * Delete a tenant — marks as 'deleting' and dispatches queue job.
   */
  static async deleteTenant(slug: string) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .first()
    if (!tenant) throw new Error(`Tenant ${slug} not found`)

    // Mark as deleting
    await db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .update({ status: 'deleting', updated_at: new Date() })

    // Dispatch queue job
    const { dispatch } = await import('#services/queue_service')
    await dispatch('delete-tenant-db', {
      slug: tenant.slug,
      dbName: tenant.db_name,
    })

    return true
  }

  /**
   * List all tenants
   */
  static async listTenants(page = 1, limit = 20) {
    return db.connection('master')
      .from('tenants')
      .select('*')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
  }

  /**
   * Get tenant by slug
   */
  static async getTenant(slug: string) {
    return db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .first()
  }
}

// ═══════════════════════════════════════════════════════════
// TENANT DATABASE SCHEMA — Applied to each new tenant DB
// ═══════════════════════════════════════════════════════════
const TENANT_SCHEMA = `
-- Users (tenant admins & staff)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  role_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK constraint
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default roles
INSERT INTO roles (name, display_name, description, permissions, is_system)
VALUES
  ('admin', 'Quản trị viên', 'Toàn quyền', '["*"]', true),
  ('editor', 'Biên tập viên', 'Quản lý nội dung', '["content.*","products.*"]', true),
  ('viewer', 'Xem', 'Chỉ xem', '["read"]', true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS auth_access_tokens (
  id SERIAL PRIMARY KEY,
  tokenable_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL DEFAULT 'auth_token',
  name VARCHAR(255),
  hash VARCHAR(255) NOT NULL,
  abilities TEXT DEFAULT '["*"]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  parent_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Brands
CREATE TABLE IF NOT EXISTS product_brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(255),
  price DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(12,2),
  promotion_price DECIMAL(12,2),
  promotion_start TIMESTAMPTZ,
  promotion_end TIMESTAMPTZ,
  image_url VARCHAR(500),
  images JSONB,
  description TEXT,
  keywords JSON,
  category VARCHAR(255),
  category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  brand_id INTEGER REFERENCES product_brands(id) ON DELETE SET NULL,
  slug VARCHAR(255),
  stock INTEGER DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'cái',
  barcode VARCHAR(255) UNIQUE,
  weight DECIMAL(8,2),
  variants JSONB,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255),
  sku VARCHAR(255),
  price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  attributes JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  unique_id VARCHAR(255),
  nickname VARCHAR(255),
  platform VARCHAR(50),
  total_comments INTEGER DEFAULT 0,
  hot_count INTEGER DEFAULT 0,
  last_label VARCHAR(50),
  tags JSON,
  notes TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream Sessions
CREATE TABLE IF NOT EXISTS livestream_sessions (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50),
  room_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  viewer_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  hot_lead_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Logs
CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES livestream_sessions(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  unique_id VARCHAR(255),
  nickname VARCHAR(255),
  comment_text TEXT,
  ai_label VARCHAR(50),
  ai_summary TEXT,
  product_intent VARCHAR(255),
  platform VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (CRM pipeline)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  chat_log_id INTEGER REFERENCES chat_logs(id) ON DELETE SET NULL,
  unique_id VARCHAR(255),
  nickname VARCHAR(255),
  comment TEXT,
  label VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  product_intent VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES livestream_sessions(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  items JSONB,
  notes TEXT,
  tracking_number VARCHAR(255),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  url VARCHAR(500),
  type VARCHAR(50) DEFAULT 'main',
  sort INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS Pages
CREATE TABLE IF NOT EXISTS cms_pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  alias VARCHAR(255),
  image VARCHAR(500),
  content TEXT,
  sort INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Keywords
CREATE TABLE IF NOT EXISTS shop_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50) DEFAULT 'highlight',
  color VARCHAR(20) DEFAULT '#ff3b5c',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-Reply Templates
CREATE TABLE IF NOT EXISTS auto_reply_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  trigger_label VARCHAR(50),
  template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock History
CREATE TABLE IF NOT EXISTS stock_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER,
  action VARCHAR(50),
  quantity_change INTEGER,
  stock_before INTEGER,
  stock_after INTEGER,
  reason TEXT,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Configs (per-tenant settings)
CREATE TABLE IF NOT EXISTS system_configs (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(50) DEFAULT 'string',
  group_name VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Promotions
CREATE TABLE IF NOT EXISTS product_promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'discount',
  value DECIMAL(12,2) DEFAULT 0,
  min_order DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applicable_products JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Customers (e-commerce)
CREATE TABLE IF NOT EXISTS shop_customers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  password VARCHAR(255),
  status INTEGER DEFAULT 1,
  address_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES shop_customers(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  address1 TEXT,
  address2 TEXT,
  country VARCHAR(100),
  province VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  postcode VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'discount',
  value DECIMAL(10,2) DEFAULT 0,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applicable_products JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Statuses (configurable)
CREATE TABLE IF NOT EXISTS order_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100),
  color VARCHAR(20),
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Statuses
CREATE TABLE IF NOT EXISTS payment_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100),
  color VARCHAR(20),
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Details (line items)
CREATE TABLE IF NOT EXISTS order_details (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name VARCHAR(255),
  sku VARCHAR(100),
  price DECIMAL(12,2) DEFAULT 0,
  qty INTEGER DEFAULT 1,
  total_price DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  attribute TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Totals (subtotal, shipping, discount, total)
CREATE TABLE IF NOT EXISTS order_totals (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  title VARCHAR(255),
  code VARCHAR(50),
  value DECIMAL(12,2) DEFAULT 0,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order History (status change timeline)
CREATE TABLE IF NOT EXISTS order_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  order_status_id INTEGER,
  content TEXT,
  admin_id INTEGER,
  add_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default order statuses
INSERT INTO order_statuses (name, label, color, sort) VALUES
  ('pending', 'Chờ xác nhận', '#fbbf24', 1),
  ('confirmed', 'Đã xác nhận', '#60a5fa', 2),
  ('processing', 'Đang xử lý', '#a78bfa', 3),
  ('shipping', 'Đang giao', '#22d3ee', 4),
  ('delivered', 'Đã giao', '#34d399', 5),
  ('completed', 'Hoàn thành', '#86efac', 6),
  ('cancelled', 'Đã hủy', '#fca5a5', 7),
  ('refunded', 'Hoàn tiền', '#fdba74', 8)
ON CONFLICT DO NOTHING;

-- Seed default payment statuses
INSERT INTO payment_statuses (name, label, color, sort) VALUES
  ('unpaid', 'Chưa thanh toán', '#fbbf24', 1),
  ('paid', 'Đã thanh toán', '#34d399', 2),
  ('refunded', 'Hoàn tiền', '#fca5a5', 3)
ON CONFLICT DO NOTHING;

-- Nav Links (storefront menu)
CREATE TABLE IF NOT EXISTS nav_links (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  icon VARCHAR(100),
  sort INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Languages (i18n)
CREATE TABLE IF NOT EXISTS languages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  icon VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Fields
CREATE TABLE IF NOT EXISTS custom_fields (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'text',
  options JSONB,
  required BOOLEAN DEFAULT false,
  entity_type VARCHAR(100),
  sort INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Field Values
CREATE TABLE IF NOT EXISTS custom_field_values (
  id SERIAL PRIMARY KEY,
  custom_field_id INTEGER REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  key VARCHAR(255) UNIQUE NOT NULL,
  secret VARCHAR(255),
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  events JSONB,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`

// ═══════════════════════════════════════════════════════════
// TENANT SEED DATA — Optional sample data for new tenants
// ═══════════════════════════════════════════════════════════
const TENANT_SEED_DATA = `
-- Default admin user (password: 123456 — bcrypt hash)
INSERT INTO users (name, full_name, email, password, role) VALUES
('admin', 'Tenant Admin', 'admin@tenant.com', '$2b$10$YourHashedPasswordHere', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Sample categories
INSERT INTO product_categories (name, slug, sort_order, is_active) VALUES
('Sản phẩm mới', 'san-pham-moi', 1, true),
('Bán chạy', 'ban-chay', 2, true),
('Khuyến mãi', 'khuyen-mai', 3, true)
ON CONFLICT DO NOTHING;

-- Welcome banner
INSERT INTO banners (title, description, image, sort, status, type) VALUES
('Chào mừng đến cửa hàng!', 'Khám phá các sản phẩm tuyệt vời', 'https://placehold.co/1400x500/7c3aed/ffffff?text=Welcome', 1, 1, 'main');

-- Default CMS pages
INSERT INTO cms_pages (title, alias, content, sort, status) VALUES
('Về chúng tôi', 'about', '<h2>Về cửa hàng</h2><p>Chào mừng bạn đến với cửa hàng của chúng tôi!</p>', 1, 1),
('Chính sách đổi trả', 'return-policy', '<h2>Chính sách đổi trả</h2><p>Đổi trả trong 30 ngày.</p>', 2, 1);
`
