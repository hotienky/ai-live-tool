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

const defaultHeader = {
  logoPosition: 'left',
  maxNavLinks: 6,
  showSearch: true,
  sticky: true,
  showAnnouncement: true,
  announcementText: 'Chào mừng bạn đến với cửa hàng của chúng tôi!',
  announcementBg: 'var(--sf-accent)',
  announcementColor: '#ffffff'
};

const defaultFooter = {
  columns: 4,
  showSocial: true,
  showNewsletter: true,
  showPaymentIcons: true,
  bgColor: 'var(--color-bg-secondary)',
  textColor: 'var(--color-text-secondary)',
  copyright: '© 2026 Bản quyền thuộc về chúng tôi.'
};

const themePresets = {
  blog: { mode: 'light', font: 'Inter', radius: '10', card_style: 'solid', accent: '#3b82f6', dark_accent: '#3b82f6', light_accent: '#2563eb' },
  fashion: { mode: 'dark', font: 'Inter', radius: '12', card_style: 'glass', accent: '#7c3aed', dark_accent: '#7c3aed', light_accent: '#6d28d9' },
  event: { mode: 'dark', font: 'Outfit', radius: '16', card_style: 'glass', accent: '#f59e0b', dark_accent: '#f59e0b', light_accent: '#d97706' },
  service: { mode: 'light', font: 'Plus Jakarta Sans', radius: '14', card_style: 'solid', accent: '#06b6d4', dark_accent: '#06b6d4', light_accent: '#0891b2' },
  realestate: { mode: 'light', font: 'Inter', radius: '10', card_style: 'solid', accent: '#10b981', dark_accent: '#10b981', light_accent: '#059669' },
  restaurant: { mode: 'light', font: 'Plus Jakarta Sans', radius: '16', card_style: 'solid', accent: '#ea580c', dark_accent: '#ea580c', light_accent: '#c2410c' },
  spa: { mode: 'light', font: 'Outfit', radius: '16', card_style: 'glass', accent: '#ec4899', dark_accent: '#ec4899', light_accent: '#db2777' }
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
      const sectionsJson = JSON.stringify(sections);
      
      const headerJson = JSON.stringify(defaultHeader);
      const footerJson = JSON.stringify(defaultFooter);
      const themePreset = themePresets[presetKey] || themePresets.blog;

      await client.query('BEGIN');
      
      // Seed Sections
      await client.query(`
        INSERT INTO system_configs (group_name, key, value, created_at, updated_at) 
        VALUES ('storefront_layout', 'sections', $1, NOW(), NOW())
        ON CONFLICT (group_name, key) DO UPDATE SET value = $1, updated_at = NOW()
      `, [sectionsJson]);

      // Seed Header
      await client.query(`
        INSERT INTO system_configs (group_name, key, value, created_at, updated_at) 
        VALUES ('storefront_layout', 'layout_header_config', $1, NOW(), NOW())
        ON CONFLICT (group_name, key) DO UPDATE SET value = $1, updated_at = NOW()
      `, [headerJson]);

      // Seed Footer
      await client.query(`
        INSERT INTO system_configs (group_name, key, value, created_at, updated_at) 
        VALUES ('storefront_layout', 'layout_footer_config', $1, NOW(), NOW())
        ON CONFLICT (group_name, key) DO UPDATE SET value = $1, updated_at = NOW()
      `, [footerJson]);

      // Seed Theme 
      for (const [tKey, tVal] of Object.entries(themePreset)) {
        await client.query(`
          INSERT INTO system_configs (group_name, key, value, created_at, updated_at) 
          VALUES ('theme', $1, $2, NOW(), NOW())
          ON CONFLICT (group_name, key) DO UPDATE SET value = $2, updated_at = NOW()
        `, [tKey, String(tVal)]);
      }

      await client.query('COMMIT');
      console.log(`✅ Seeded ${tenantId}`);
    } catch(err) {
      await client.query('ROLLBACK');
      console.error(`Error seeding ${tenantId}:`, err.message);
    } finally {
      await client.end();
    }
  }
}
run();
