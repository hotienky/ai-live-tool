/**
 * Add missing columns to shops table
 * Run: node database/add_missing_shop_columns.mjs
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
  const { rows: cols } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='shops'"
  )
  const existing = cols.map(c => c.column_name)
  const additions = []

  if (!existing.includes('shipping_config')) additions.push("ADD COLUMN shipping_config JSONB")
  if (!existing.includes('default_carrier')) additions.push("ADD COLUMN default_carrier VARCHAR(50) DEFAULT 'manual'")
  if (!existing.includes('sender_name')) additions.push("ADD COLUMN sender_name VARCHAR(255)")
  if (!existing.includes('sender_phone')) additions.push("ADD COLUMN sender_phone VARCHAR(20)")
  if (!existing.includes('sender_address')) additions.push("ADD COLUMN sender_address TEXT")

  if (additions.length > 0) {
    await client.query('ALTER TABLE shops ' + additions.join(', '))
    console.log('✅ Added', additions.length, 'columns to shops:', additions.map(a => a.split(' ')[2]).join(', '))
  } else {
    console.log('✅ shops already has all required columns')
  }
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
