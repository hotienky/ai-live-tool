import { industryTemplates } from './frontend/src/components/storefront/templatePresets.js';
import pg from 'pg';
const { Client } = pg;

const schemas = {
  blog: 'blog',
  shop: 'fashion',
  event: 'event',
  service: 'service',
  bds: 'realestate',
  restaurant: 'restaurant',
  spa: 'spa'
};

async function run() {
  for (const [tenantId, presetKey] of Object.entries(schemas)) {
    console.log(`Seeding layout for tenant: ${tenantId} using preset ${presetKey}`);
    const client = new Client({
      connectionString: `postgres://postgres:postgres@localhost:5433/tenant_${tenantId}`
    });
    try {
      await client.connect();
      const sections = industryTemplates[presetKey];
      const jsonStr = JSON.stringify(sections);
      
      // The configs table mapping
      await client.query(`
        INSERT INTO configs (group_key, key, value, created_at, updated_at) 
        VALUES ('storefront_layout', 'sections', $1, NOW(), NOW())
        ON CONFLICT (group_key, key) DO UPDATE SET value = $1, updated_at = NOW()
      `, [jsonStr]);
      
      console.log(`✅ Seeded ${tenantId}`);
    } catch(err) {
      console.error(`Error seeding ${tenantId}:`, err.message);
    } finally {
      await client.end();
    }
  }
}
run();
