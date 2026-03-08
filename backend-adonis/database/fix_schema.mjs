/**
 * Comprehensive column fixer — Adds ALL missing columns for all tables
 * Run: node database/fix_schema.mjs
 */
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: 'localhost', port: 5432,
  user: 'postgres', password: 'postgres',
  database: 'ai_live_tool',
})

const client = await pool.connect()

async function addMissing(table, columns) {
  const { rows } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name=$1", [table]
  )
  const existing = new Set(rows.map(r => r.column_name))
  const toAdd = columns.filter(([name]) => !existing.has(name))

  if (toAdd.length === 0) {
    console.log(`  ✅ ${table} — all columns present`)
    return
  }

  const alterClauses = toAdd.map(([name, def]) => `ADD COLUMN ${name} ${def}`).join(', ')
  await client.query(`ALTER TABLE ${table} ${alterClauses}`)
  console.log(`  ✅ ${table} — added: ${toAdd.map(([n]) => n).join(', ')}`)
}

try {
  console.log('🔧 Checking and adding missing columns...\n')

  await addMissing('products', [
    ['description', 'TEXT'],
    ['stock', 'INTEGER NOT NULL DEFAULT 0'],
    ['sku', 'VARCHAR(100)'],
    ['low_stock_threshold', 'INTEGER NOT NULL DEFAULT 10'],
    ['is_active', 'BOOLEAN NOT NULL DEFAULT true'],
  ])

  await addMissing('shops', [
    ['shipping_config', 'JSONB'],
    ['default_carrier', "VARCHAR(50) DEFAULT 'manual'"],
    ['sender_name', 'VARCHAR(255)'],
    ['sender_phone', 'VARCHAR(20)'],
    ['sender_address', 'TEXT'],
  ])

  await addMissing('customers', [
    ['profile_picture_url', 'TEXT'],
    ['profile_link', 'TEXT'],
  ])

  await addMissing('chat_logs', [
    ['profile_link', 'TEXT'],
  ])

  await addMissing('leads', [
    ['notes', 'TEXT'],
    ['product_intent', 'VARCHAR(255)'],
  ])

  await addMissing('orders', [
    ['lead_id', 'UUID'],
    ['tracking_number', 'VARCHAR(100)'],
    ['payment_method', 'VARCHAR(50)'],
    ['payment_status', "VARCHAR(30) DEFAULT 'unpaid'"],
    ['confirmed_at', 'TIMESTAMPTZ'],
    ['shipped_at', 'TIMESTAMPTZ'],
    ['delivered_at', 'TIMESTAMPTZ'],
  ])

  console.log('\n🎉 All schema fixes applied!')
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
