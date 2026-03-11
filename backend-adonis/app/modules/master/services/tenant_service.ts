import db from '@adonisjs/lucid/services/db'

/**
 * TenantService — Manages tenant lifecycle: create, migrate, seed, suspend, delete.
 */
export default class TenantService {
  /**
   * Create a new tenant: insert into master DB + create PostgreSQL database
   */
  static async createTenant(data: {
    name: string
    slug: string
    ownerEmail: string
    ownerName?: string
    plan?: string
  }) {
    const dbName = `tenant_${data.slug}`

    // 1. Insert into master DB
    const [tenant] = await db.connection('master')
      .table('tenants')
      .insert({
        name: data.name,
        slug: data.slug,
        db_name: dbName,
        owner_email: data.ownerEmail,
        owner_name: data.ownerName || data.name,
        plan: data.plan || 'free',
        status: 'active',
      })
      .returning('*')

    // 2. Create the PostgreSQL database for this tenant
    // Use raw connection to avoid transaction issues with CREATE DATABASE
    await db.rawQuery(`CREATE DATABASE "${dbName}" OWNER postgres`)

    // 3. Run tenant migrations on the new DB
    await this.migrateTenant(data.slug, dbName)

    return tenant
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
   * Delete a tenant (careful!)
   */
  static async deleteTenant(slug: string) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .first()
    if (!tenant) throw new Error(`Tenant ${slug} not found`)

    // Drop the tenant database
    await db.rawQuery(`DROP DATABASE IF EXISTS "${tenant.db_name}"`)

    // Remove from master
    await db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .delete()

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
