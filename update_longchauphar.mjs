import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: `postgres://postgres:postgres@localhost:5433/tenant_longchauphar`
  });
  
  try {
    await client.connect();
    
    // Select BOTH published and draft if available
    const keysToUpdate = ['layout_sections', 'layout_draft_sections'];
    
    for (const key of keysToUpdate) {
        const res = await client.query(`SELECT value FROM system_configs WHERE key = $1`, [key]);
        if (res.rows.length === 0) continue;
        
        let sections = res.rows[0].value;
        if (typeof sections === 'string') {
            sections = JSON.parse(sections);
        }
        
        // Find the hero or banner section to replace it
        let updated = false;
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].type === 'banner' || sections[i].type === 'image_banner' || sections[i].type === 'hero_banner' || sections[i].type === 'pharmacy_hero') {
                sections[i].type = 'pharmacy_hero';
                sections[i].params = {
                    desktopImage: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=2070&auto=format&fit=crop',
                    hotKeywords: 'phòng ngừa tay chân miệng, khẩu trang, sữa dinh dưỡng, để phòng covid, kem chống nắng, Mua 1 Tặng 1',
                    searchPlaceholder: 'Bạn đang tìm gì hôm nay...'
                };
                sections[i].content = [
                    { title: 'Đặt đơn thuốc', url: '#', lucideIcon: 'Pill' },
                    { title: 'Liên hệ dược sĩ', url: '#', lucideIcon: 'Stethoscope' },
                    { title: 'Tìm nhà thuốc', url: '#', lucideIcon: 'Heart' }
                ];
                updated = true;
                break; // only replace the first
            }
        }
        
        if (updated) {
            const updatedJson = JSON.stringify(sections);
            await client.query(`
              UPDATE system_configs 
              SET value = $1, updated_at = NOW() 
              WHERE key = $2
            `, [updatedJson, key]);
            console.log(`✅ Updated ${key}`);
        }
    }
  } catch(err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
