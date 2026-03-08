/**
 * Create missing tables (using correct UUID types)
 * Run: node database/create_missing_tables.mjs
 */
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: 'localhost', port: 5432,
  user: 'postgres', password: 'postgres',
  database: 'ai_live_tool',
})

const client = await pool.connect()
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id SERIAL PRIMARY KEY,
      shop_id UUID NOT NULL,
      url VARCHAR(500) NOT NULL,
      events VARCHAR(500) NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT true,
      secret VARCHAR(255),
      last_status INTEGER,
      last_triggered_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('✅ webhooks')

  await client.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      shop_id UUID NOT NULL,
      user_id INTEGER,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id INTEGER,
      details JSONB,
      ip VARCHAR(45),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('✅ activity_logs')

  await client.query(`
    CREATE TABLE IF NOT EXISTS stock_history (
      id SERIAL PRIMARY KEY,
      product_id UUID NOT NULL,
      shop_id UUID NOT NULL,
      user_id INTEGER,
      action VARCHAR(30) NOT NULL,
      quantity_change INTEGER NOT NULL,
      stock_before INTEGER NOT NULL DEFAULT 0,
      stock_after INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      reference_type VARCHAR(30),
      reference_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('✅ stock_history')

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id SERIAL PRIMARY KEY,
      product_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      price DECIMAL(15,2),
      cost_price DECIMAL(15,2),
      stock INTEGER NOT NULL DEFAULT 0,
      attributes JSONB,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('✅ product_variants')

  await client.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      order_id UUID NOT NULL,
      shop_id UUID NOT NULL,
      carrier VARCHAR(50) NOT NULL DEFAULT 'manual',
      tracking_code VARCHAR(100),
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      sender_name VARCHAR(255),
      sender_phone VARCHAR(20),
      sender_address TEXT,
      sender_ward VARCHAR(100),
      sender_district VARCHAR(100),
      sender_province VARCHAR(100),
      receiver_name VARCHAR(255),
      receiver_phone VARCHAR(20),
      receiver_address TEXT,
      receiver_ward VARCHAR(100),
      receiver_district VARCHAR(100),
      receiver_province VARCHAR(100),
      shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
      cod_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      insurance_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
      weight INTEGER NOT NULL DEFAULT 0,
      dimensions VARCHAR(50),
      carrier_order_code VARCHAR(100),
      carrier_status VARCHAR(50),
      carrier_response TEXT,
      estimated_delivery_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('✅ shipments')

  await client.query(`
    CREATE TABLE IF NOT EXISTS shipment_history (
      id SERIAL PRIMARY KEY,
      shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      status VARCHAR(30) NOT NULL,
      location VARCHAR(255),
      description TEXT,
      source VARCHAR(30) NOT NULL DEFAULT 'system',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('✅ shipment_history')

  // Extend products table if needed
  const { rows: cols } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='products'"
  )
  const colNames = cols.map(c => c.column_name)
  const additions = []
  if (!colNames.includes('cost_price')) additions.push('ADD COLUMN cost_price DECIMAL(15,2)')
  if (!colNames.includes('category')) additions.push('ADD COLUMN category VARCHAR(100)')
  if (!colNames.includes('unit')) additions.push("ADD COLUMN unit VARCHAR(20) DEFAULT 'cái'")
  if (!colNames.includes('barcode')) additions.push('ADD COLUMN barcode VARCHAR(50)')
  if (!colNames.includes('variants')) additions.push('ADD COLUMN variants JSONB')
  if (additions.length > 0) {
    await client.query('ALTER TABLE products ' + additions.join(', '))
    console.log('✅ products extended:', additions.length, 'columns')
  } else {
    console.log('✅ products already has all columns')
  }

  console.log('\n🎉 All missing tables created!')
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
