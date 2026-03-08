/**
 * Full Database Seeder — Matches actual PostgreSQL schema exactly
 *
 * Usage:  node database/seed.mjs
 * Reset:  SEED_FORCE=1 node database/seed.mjs
 */
import pg from 'pg'
import { randomUUID } from 'node:crypto'
const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'ai_live_tool',
})
const client = await pool.connect()

try {
  const existing = await client.query("SELECT id FROM users WHERE email = 'demo@demo.com' LIMIT 1")
  const force = process.env.SEED_FORCE === '1'
  if (existing.rows.length > 0 && !force) { console.log('✅ Data exists. SEED_FORCE=1 to re-seed.'); process.exit(0) }

  if (force) {
    console.log('🧹 Wiping...')
    for (const t of ['shipment_history','shipments','activity_logs','webhooks','notifications','auto_reply_templates','shop_keywords','stock_history','product_variants','leads','orders','chat_logs','customers','products','livestream_sessions','scheduled_livestreams','shops','auth_access_tokens','users']) {
      try { await client.query(`DELETE FROM ${t}`) } catch {}
    }
  }

  await client.query('BEGIN')

  // AdonisJS scrypt hash for '123456' — generated via AdonisJS register endpoint
  const pw = '$scrypt$n=16384,r=8,p=1$YxwLdf+5a16U7A/p2jlDhQ$Tfl9kRDDhcS50KT+dlRY7BmNLoSJv+LylhH9iPKAvUAL4ShKx+fc3l9VAAhTH3bVag2YVjiFIm5i/RshFbisCg'

  // ── USERS ────────────────────────────────────────
  const { rows: [u1, u2] } = await client.query(`
    INSERT INTO users (name, full_name, email, password, role, created_at, updated_at) VALUES
    ('demo', 'Demo User',  'demo@demo.com',  $1, 'admin', NOW(), NOW()),
    ('staff', 'Nhân viên A', 'staff@demo.com', $1, 'staff', NOW(), NOW())
    RETURNING id
  `, [pw])
  console.log('👤 Users ✓')

  // ── SHOPS ────────────────────────────────────────
  const { rows: [s1, s2] } = await client.query(`
    INSERT INTO shops (
      shop_name, user_id, platform, tiktok_username,
      facebook_page_id, facebook_access_token, youtube_channel, youtube_api_key,
      shopee_id, shopee_partner_id, shopee_partner_key, shopee_shop_id_api,
      is_active, auto_reply_enabled,
      moderation_blacklist, moderation_hide_spam, moderation_rate_limit, moderation_max_per_minute,
      shipping_config, default_carrier, sender_name, sender_phone, sender_address,
      created_at, updated_at
    ) VALUES (
      'Baby Shop Sữa Mẹ', $1, 'tiktok', 'babyshop_suame',
      'demo_fb_page', 'demo_fb_token', 'UCdemo', 'demo_yt_key',
      'shopee_123', 'partner_123', 'key_123', 'api_123',
      true, true,
      E'spam\nquảng cáo\nfake', true, true, 5,
      '{"ghn":{"token":"demo_ghn_token","shopId":"4235123"},"ghtk":{"token":"demo_ghtk_token"},"viettel_post":{"token":""}}',
      'ghn', 'Baby Shop HCM', '0901234567', '123 Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM',
      NOW(), NOW()
    ), (
      'Thời Trang Trẻ Em', $1, 'facebook', '',
      'fb_fashion_page', 'demo_fb_token_2', NULL, NULL,
      NULL, NULL, NULL, NULL,
      true, false,
      NULL, true, false, 10,
      NULL, 'manual', 'TT Trẻ Em', '0987654321', '456 Lê Lợi, Q.3, TP.HCM',
      NOW(), NOW()
    ) RETURNING id, shop_name
  `, [u1.id])
  console.log('🏪 Shops:', s1.shop_name, '+', s2.shop_name)

  // ── PRODUCTS ─────────────────────────────────────
  const { rows: prods } = await client.query(`
    INSERT INTO products (
      id, shop_id, name, price, keywords, description,
      is_active, stock, sku, low_stock_threshold,
      cost_price, category, unit, barcode, created_at, updated_at
    ) VALUES
    (gen_random_uuid(),$1,'Sữa Meiji 0-1 tuổi',  450000,ARRAY['meiji','sữa meiji'],'Sữa Meiji Nhật lon 800g',true,150,'MEIJI-01-800',10,380000,'Sữa bột','lon','8901234567890',NOW(),NOW()),
    (gen_random_uuid(),$1,'Sữa Nan Optipro 2',   520000,ARRAY['nan','sữa nan'],    'Sữa Nan số 2 6-12 tháng',true, 85,'NAN-02-900',  15,430000,'Sữa bột','lon','8901234567891',NOW(),NOW()),
    (gen_random_uuid(),$1,'Bỉm Merries size M',  320000,ARRAY['bỉm','merries'],    'Bỉm Merries M 64 miếng', true,200,'MER-M-64',   20,260000,'Bỉm tã', 'gói','8901234567892',NOW(),NOW()),
    (gen_random_uuid(),$1,'Bình sữa Pigeon 240ml',185000,ARRAY['bình sữa','pigeon'],'Bình Pigeon cổ rộng',    true, 45,'PIG-240',    10,120000,'Phụ kiện','cái','8901234567893',NOW(),NOW()),
    (gen_random_uuid(),$1,'Combo Sữa Meiji+Bỉm', 720000,ARRAY['combo'],            'Combo tiết kiệm',         true, 30,'COMBO-MB-01', 5,600000,'Combo',  'bộ', NULL,NOW(),NOW()),
    (gen_random_uuid(),$1,'Sữa tắm Johnson Baby', 95000,ARRAY['sữa tắm','johnson'],'Johnson 500ml Top-to-Toe',true,  8,'JB-500',     10, 65000,'Chăm sóc','chai',NULL,NOW(),NOW()),
    (gen_random_uuid(),$2,'Áo thun cho bé trai', 120000,ARRAY['áo thun','bé trai'], 'Áo cotton 100% 1-5 tuổi', true,300,'AT-BOY-01',  30, 55000,'Áo',     'cái', NULL,NOW(),NOW()),
    (gen_random_uuid(),$2,'Quần short bé gái',    95000,ARRAY['quần short'],        'Quần jean bé gái 2-6t',   true,  0,'QS-GIRL-01', 20, 40000,'Quần',   'cái', NULL,NOW(),NOW())
    RETURNING id, name
  `, [s1.id, s2.id])
  console.log('📦 Products:', prods.length)

  // Product Variants
  await client.query(`
    INSERT INTO product_variants (product_id,name,sku,price,cost_price,stock,attributes,is_active,created_at,updated_at) VALUES
    ($1,'Lon 400g','MEIJI-400',250000,200000,50,'{"size":"400g"}',true,NOW(),NOW()),
    ($1,'Lon 800g','MEIJI-800V',450000,380000,100,'{"size":"800g"}',true,NOW(),NOW()),
    ($2,'Size 1','AT-S1',110000,50000,80,'{"size":"S1","color":"Xanh"}',true,NOW(),NOW()),
    ($2,'Size 2','AT-S2',120000,55000,120,'{"size":"S2","color":"Xanh"}',true,NOW(),NOW()),
    ($2,'Size 3','AT-S3',130000,60000,100,'{"size":"S3","color":"Trắng"}',true,NOW(),NOW())
  `, [prods[0].id, prods[6].id])

  // Stock History
  await client.query(`
    INSERT INTO stock_history (product_id,shop_id,user_id,action,quantity_change,stock_before,stock_after,reason,reference_type,created_at) VALUES
    ($1,$3,$4,'add',150,0,150,'Nhập kho lần đầu','import',NOW()-INTERVAL '10 days'),
    ($2,$3,$4,'add',100,0,100,'Nhập kho lần đầu','import',NOW()-INTERVAL '10 days'),
    ($2,$3,$4,'deduct',-15,100,85,'Bán qua live','order',NOW()-INTERVAL '3 days')
  `, [prods[0].id, prods[1].id, s1.id, u1.id])
  console.log('   Variants & Stock ✓')

  // ── KEYWORDS ─────────────────────────────────────
  await client.query(`
    INSERT INTO shop_keywords (id,shop_id,keyword,alert_type,color,auto_reply_text,is_active,created_at,updated_at) VALUES
    (gen_random_uuid(),$1,'mua','highlight','#ff3b5c',NULL,true,NOW(),NOW()),
    (gen_random_uuid(),$1,'giá','highlight','#f59e0b',NULL,true,NOW(),NOW()),
    (gen_random_uuid(),$1,'đặt hàng','auto_reply','#10b981','Dạ chị ơi, mình inbox ngay nhé! 💚',true,NOW(),NOW()),
    (gen_random_uuid(),$1,'ship','highlight','#3b82f6',NULL,true,NOW(),NOW()),
    (gen_random_uuid(),$1,'combo','auto_reply','#8b5cf6','Combo đang giảm 15%! Inbox chi tiết nhé 🎉',true,NOW(),NOW()),
    (gen_random_uuid(),$1,'sdt','highlight','#ef4444',NULL,true,NOW(),NOW()),
    (gen_random_uuid(),$2,'size','highlight','#06b6d4',NULL,true,NOW(),NOW()),
    (gen_random_uuid(),$2,'mẫu mới','highlight','#ec4899',NULL,true,NOW(),NOW())
  `, [s1.id, s2.id])
  console.log('🔑 Keywords ✓')

  // ── AUTO-REPLY TEMPLATES ─────────────────────────
  await client.query(`
    INSERT INTO auto_reply_templates (id,shop_id,trigger_label,template_text,is_active,created_at,updated_at) VALUES
    (gen_random_uuid(),$1,'HOT','Cảm ơn {{nickname}}! Inbox ngay nhé 💌',true,NOW(),NOW()),
    (gen_random_uuid(),$1,'HOT','Dạ {{nickname}} ơi, còn hàng ạ! Inbox tư vấn nha 🛒',true,NOW(),NOW()),
    (gen_random_uuid(),$1,'WARM','Chào {{nickname}}! Tư vấn thêm không ạ? 😊',true,NOW(),NOW()),
    (gen_random_uuid(),$1,'keyword','{{nickname}} ơi, shop đang ưu đãi đặc biệt nhé 🎁',true,NOW(),NOW()),
    (gen_random_uuid(),$2,'HOT','Hi {{nickname}}! Inbox tư vấn size nhé ❤️',true,NOW(),NOW())
  `, [s1.id, s2.id])
  console.log('💬 Templates ✓')

  // ── CUSTOMERS ────────────────────────────────────
  const cData = [
    ['hoangmaichi_99','Hoàng Mai Chi','tiktok',12,3,'[HOT]',s1.id,'["VIP","Khách quen"]','Khách VIP'],
    ['ngoclan.do','Đỗ Ngọc Lan','facebook',18,2,'[WARM]',s1.id,'["VIP"]',null],
    ['thuhuong.vu','Vũ Thu Hương','tiktok',7,1,'[COLD]',s1.id,'["VIP"]',null],
    ['thanhha.pham','Phạm Thanh Hà','facebook',9,4,'[HOT]',s1.id,'["VIP"]',null],
    ['thuytrang.le','Lê Thùy Trang','tiktok',22,2,'[HOT]',s1.id,'["Mới"]',null],
    ['minhanh.tran','Trần Minh Anh','facebook',15,3,'[HOT]',s1.id,'["Mới"]',null],
    ['thihoa.nguyen','Nguyễn Thị Hoa','tiktok',25,1,'[WARM]',s1.id,'["Mới"]',null],
    ['thanhnhan.bui','Bùi Thanh Nhàn','facebook',5,0,'[WARM]',s1.id,'["Mới"]',null],
    ['thikim.ngo','Ngô Thị Kim','tiktok',8,1,'[COLD]',s2.id,'["Mới"]',null],
    ['phuonglinh.ho','Hồ Phương Linh','facebook',11,2,'[HOT]',s1.id,'["Mới"]',null],
    ['vanhung.dang','Đặng Văn Hùng','tiktok',6,1,'[HOT]',s2.id,'["Mới"]',null],
    ['minhtuan.ly','Lý Minh Tuấn','facebook',4,0,'[COLD]',s2.id,'["Mới"]',null],
  ]
  const cp = []; const ph = cData.map((c,i) => { const b=i*9; cp.push(...c); return `(gen_random_uuid(),$${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},NOW(),NOW())` }).join(',')
  const { rows: custs } = await client.query(`INSERT INTO customers (id,platform_user_id,nickname,platform,total_interactions,hot_count,last_label,shop_id,tags,notes,created_at,updated_at) VALUES ${ph} RETURNING id,nickname`, cp)
  console.log('👥 Customers:', custs.length)

  // ── LIVESTREAM SESSIONS ──────────────────────────
  // actual columns: id,shop_id,platform,platform_live_id,status,started_at,ended_at,total_comments,hot_count,warm_count,cold_count,peak_viewers,duration_minutes,shop_name
  const { rows: sessions } = await client.query(`
    INSERT INTO livestream_sessions (
      shop_id,platform,platform_live_id,status,started_at,ended_at,
      total_comments,hot_count,warm_count,cold_count,peak_viewers,duration_minutes,shop_name
    ) VALUES
    ($1,'tiktok','room_1001','Ended',NOW()-INTERVAL '27 hours',NOW()-INTERVAL '25 hours', 340,28,45,267,1250,120,$3),
    ($1,'tiktok','room_1002','Ended',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days'+INTERVAL '2 hours', 215,15,32,168,890,120,$3),
    ($1,'facebook','fb_live_01','Ended',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'+INTERVAL '90 minutes', 142,12,25,105,560,90,$3),
    ($2,'tiktok','room_2001','Ended',NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days'+INTERVAL '1 hour', 95,8,18,69,420,60,$4)
    RETURNING id
  `, [s1.id, s2.id, s1.shop_name, s2.shop_name])
  console.log('🎬 Sessions:', sessions.length)

  // ── CHAT LOGS ────────────────────────────────────
  // actual columns: id,session_id,customer_id,comment_text,ai_label,created_at,shop_id,nickname,unique_id,platform,profile_link,profile_picture_url,ai_summary,product_intent
  const comments = [
    { t:'Sữa Meiji giá bao nhiêu vậy chị? Có combo nào rẻ hơn không?',        l:'HOT',p:'Sữa Meiji',ci:0,si:0},
    { t:'Bé nhà mình 8kg, 5 tháng tuổi dùng size nào ạ?',                      l:'WARM',p:'Bỉm Merries',ci:1,si:0},
    { t:'Bình sữa này chất liệu gì? BPA free không?',                          l:'WARM',p:'Bình Pigeon',ci:2,si:0},
    { t:'Đặt cho mình bộ đồ sơ sinh nhé. SĐT: 0912345678',                    l:'HOT',p:null,ci:3,si:0},
    { t:'Mua 3 hộp sữa, ship Đà Nẵng bao nhiêu?',                             l:'HOT',p:'Sữa Meiji',ci:4,si:0},
    { t:'Chốt 1 bộ quần áo size 80 + 1 bình sữa. SĐT: 0911222333',           l:'HOT',p:'Combo',ci:5,si:0},
    { t:'Sữa này bé 6 tháng dùng size nào? SĐT: 0901234567',                  l:'HOT',p:'Sữa Nan',ci:6,si:0},
    { t:'Bỉm này mấy size? Bé 10kg dùng được không?',                          l:'WARM',p:'Bỉm Merries',ci:7,si:0},
    { t:'Cách pha sữa này thế nào ạ? Bé hay đầy bụng',                        l:'COLD',p:'Sữa Meiji',ci:8,si:1},
    { t:'Tã dán giá bao nhiêu? Có combo rẻ hơn không ạ?',                      l:'HOT',p:'Bỉm Merries',ci:9,si:1},
    { t:'Quá đẹp, đặt 2 bộ size 90 luôn nhé!',                                l:'HOT',p:'Áo thun',ci:10,si:3},
    { t:'Hàng sẵn không? Ship Hà Nội mấy ngày?',                               l:'WARM',p:null,ci:11,si:3},
    { t:'Xin chào shop!',                                                       l:'COLD',p:null,ci:0,si:2},
    { t:'Theo dõi shop lâu r, hôm nay mới mua 😍',                             l:'WARM',p:null,ci:1,si:2},
    { t:'Giá sốc quá, chốt 5 hộp sữa + 3 gói bỉm. SĐT: 0905111222',         l:'HOT',p:'Combo',ci:4,si:1},
  ]
  const chatIds = []
  for (const c of comments) {
    const sid = c.si < 3 ? s1.id : s2.id
    const plat = c.si === 2 ? 'facebook' : 'tiktok'
    const sum = c.l==='HOT'?'Ý định mua rõ':c.l==='WARM'?'Đang tìm hiểu':'Chưa rõ ý định'
    const { rows } = await client.query(`
      INSERT INTO chat_logs (session_id,customer_id,comment_text,ai_label,shop_id,nickname,unique_id,platform,ai_summary,product_intent,created_at)
      VALUES ($1,$2,$3,$4::enum_chat_logs_ai_label,$5,$6,$7,$8,$9,$10,NOW()-INTERVAL '${Math.floor(Math.random()*120)} minutes') RETURNING id
    `, [sessions[c.si].id, custs[c.ci].id, c.t, c.l, sid, cData[c.ci][1], cData[c.ci][0], plat, sum, c.p])
    chatIds.push(rows[0].id)
  }
  console.log('💬 ChatLogs:', chatIds.length)

  // ── LEADS ────────────────────────────────────────
  const statuses = ['New','Contacting','Closed','Ignored']
  let lc = 0
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].l === 'COLD') continue
    await client.query(`
      INSERT INTO leads (id,chat_log_id,customer_id,unique_id,nickname,comment,label,status,product_intent,notes,created_at,updated_at)
      VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7::enum_leads_status,$8,$9,NOW()-INTERVAL '${Math.floor(Math.random()*72)} hours',NOW())
    `, [chatIds[i], custs[comments[i].ci].id, cData[comments[i].ci][0], cData[comments[i].ci][1], comments[i].t, comments[i].l, statuses[lc%4], comments[i].p, comments[i].l==='HOT'?'Cần liên hệ ngay':null])
    lc++
  }
  console.log('🎯 Leads:', lc)

  // ── ORDERS ───────────────────────────────────────
  // actual: id,shop_id,customer_id,customer_name,customer_phone,total_amount,payment_status,status,items,notes,shipping_address,created_at,updated_at,session_id,lead_id,customer_address,tracking_number,payment_method,confirmed_at,shipped_at,delivered_at
  const { rows: ords } = await client.query(`
    INSERT INTO orders (
      id,shop_id,session_id,customer_id,customer_name,customer_phone,customer_address,
      status,total_amount,payment_method,payment_status,items,notes,tracking_number,
      confirmed_at,shipped_at,delivered_at,created_at,updated_at
    ) VALUES
    (gen_random_uuid(),$1,$3,$5,'Hoàng Mai Chi','0912345678','12 Lê Lợi, Q.1, HCM',
     'confirmed',920000,'bank_transfer','paid','[{"name":"Sữa Meiji","qty":1,"price":450000},{"name":"Bỉm Merries M","qty":1,"price":320000},{"name":"Bình Pigeon","qty":1,"price":185000}]',
     'Giao trước 5h chiều',NULL,NOW()-INTERVAL '1 day',NULL,NULL,NOW()-INTERVAL '2 days',NOW()),
    (gen_random_uuid(),$1,$3,$7,'Lê Thùy Trang','0905111222','45 Trần Phú, Đà Nẵng',
     'shipped',1350000,'cod','unpaid','[{"name":"Sữa Meiji","qty":3,"price":450000}]',
     NULL,'GHN123456789',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day',NULL,NOW()-INTERVAL '3 days',NOW()),
    (gen_random_uuid(),$1,$4,$8,'Trần Minh Anh','0911222333','78 Hai Bà Trưng, Q.3, HCM',
     'delivered',405000,'momo','paid','[{"name":"Bỉm Merries M","qty":1,"price":320000},{"name":"Sữa tắm Johnson","qty":1,"price":95000}]',
     NULL,'GHTK987654321',NOW()-INTERVAL '5 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '2 days',NOW()-INTERVAL '6 days',NOW()),
    (gen_random_uuid(),$1,NULL,$9,'Nguyễn Thị Hoa','0901234567',NULL,
     'draft',520000,NULL,'unpaid','[{"name":"Sữa Nan Optipro 2","qty":1,"price":520000}]',
     'Auto-created from live',NULL,NULL,NULL,NULL,NOW()-INTERVAL '1 day',NOW()),
    (gen_random_uuid(),$1,NULL,$10,'Hồ Phương Linh','0908765432','99 Nguyễn Văn Cừ, Q.5, HCM',
     'pending',720000,'bank_transfer','unpaid','[{"name":"Combo Sữa+Bỉm","qty":1,"price":720000}]',
     NULL,NULL,NULL,NULL,NULL,NOW()-INTERVAL '12 hours',NOW()),
    (gen_random_uuid(),$1,NULL,$6,'Phạm Thanh Hà','0912345679',NULL,
     'cancelled',185000,'momo','refunded','[{"name":"Bình Pigeon","qty":1,"price":185000}]',
     'Khách hủy',NULL,NULL,NULL,NULL,NOW()-INTERVAL '4 days',NOW()),
    (gen_random_uuid(),$2,$11,$12,'Đặng Văn Hùng','0977888999','15 Lê Duẩn, Hà Nội',
     'confirmed',240000,'cod','unpaid','[{"name":"Áo thun bé trai","qty":2,"price":120000}]',
     NULL,NULL,NOW()-INTERVAL '1 day',NULL,NULL,NOW()-INTERVAL '2 days',NOW()),
    (gen_random_uuid(),$1,NULL,$13,'Bùi Thanh Nhàn','0966777888','200 CMT8, Q.3, HCM',
     'draft',450000,NULL,'unpaid','[{"name":"Sữa Meiji","qty":1,"price":450000}]',
     'Auto-created from live',NULL,NULL,NULL,NULL,NOW()-INTERVAL '6 hours',NOW())
    RETURNING id,customer_name,status
  `, [s1.id,s2.id,sessions[0].id,sessions[1].id,custs[0].id,custs[3].id,custs[4].id,custs[5].id,custs[6].id,custs[9].id,sessions[3].id,custs[10].id,custs[7].id])
  console.log('🧾 Orders:', ords.length)

  // ── SHIPMENTS ────────────────────────────────────
  const { rows: ships } = await client.query(`
    INSERT INTO shipments (order_id,shop_id,carrier,tracking_code,status,
      sender_name,sender_phone,sender_address,sender_district,sender_province,
      receiver_name,receiver_phone,receiver_address,receiver_district,receiver_province,
      shipping_fee,cod_amount,insurance_fee,weight,carrier_order_code,carrier_status,
      estimated_delivery_at,delivered_at,created_at,updated_at) VALUES
    ($1,$5,'ghn','GHN123456789','in_transit','Baby Shop','0901234567','123 Nguyễn Huệ, Q.1','Q.1','TP.HCM','Lê Thùy Trang','0905111222','45 Trần Phú','Hải Châu','Đà Nẵng',35000,1350000,5000,2500,'GHN-001','delivering',NOW()+INTERVAL '1 day',NULL,NOW()-INTERVAL '1 day',NOW()),
    ($2,$5,'ghtk','GHTK987654321','delivered','Baby Shop','0901234567','123 Nguyễn Huệ, Q.1','Q.1','TP.HCM','Trần Minh Anh','0911222333','78 HBT, Q.3','Q.3','TP.HCM',22000,0,0,1200,'GHTK-001','delivered',NULL,NOW()-INTERVAL '2 days',NOW()-INTERVAL '5 days',NOW()),
    ($3,$5,'ghn','GHN111222333','pending','Baby Shop','0901234567','123 Nguyễn Huệ, Q.1','Q.1','TP.HCM','Hoàng Mai Chi','0912345678','12 Lê Lợi, Q.1','Q.1','TP.HCM',18000,0,0,3000,'GHN-002',NULL,NULL,NULL,NOW()-INTERVAL '12 hours',NOW()),
    ($4,$6,'viettel_post','VP555666777','picked_up','TT Trẻ Em','0987654321','456 Lê Lợi, Q.3','Q.3','TP.HCM','Đặng Văn Hùng','0977888999','15 Lê Duẩn','Hoàn Kiếm','Hà Nội',40000,240000,3000,500,'VP-001','picking',NOW()+INTERVAL '3 days',NULL,NOW()-INTERVAL '1 day',NOW()),
    ($7,$5,'manual',NULL,'draft','Baby Shop','0901234567','123 Nguyễn Huệ',NULL,NULL,'Hồ Phương Linh','0908765432','99 NVC, Q.5',NULL,NULL,0,0,0,2000,NULL,NULL,NULL,NULL,NOW()-INTERVAL '6 hours',NOW())
    RETURNING id,tracking_code,status
  `, [ords[1].id,ords[2].id,ords[0].id,ords[6].id,s1.id,s2.id,ords[4].id])

  await client.query(`
    INSERT INTO shipment_history (shipment_id,status,location,description,source,created_at) VALUES
    ($1,'pending',NULL,'Đơn hàng đã tạo','system',NOW()-INTERVAL '36 hours'),
    ($1,'picked_up','Q.1, HCM','Shipper đã lấy hàng','carrier',NOW()-INTERVAL '30 hours'),
    ($1,'in_transit','Kho HCM','Đang vận chuyển ra Đà Nẵng','carrier',NOW()-INTERVAL '24 hours'),
    ($2,'pending',NULL,'Đơn hàng đã tạo','system',NOW()-INTERVAL '5 days'),
    ($2,'picked_up','Q.1, HCM','Đã lấy hàng','carrier',NOW()-INTERVAL '4 days'),
    ($2,'delivered','Q.3, HCM','Giao thành công','carrier',NOW()-INTERVAL '2 days'),
    ($3,'pending',NULL,'Đơn hàng chờ lấy','system',NOW()-INTERVAL '12 hours'),
    ($4,'pending',NULL,'Tạo vận đơn VTP','system',NOW()-INTERVAL '24 hours'),
    ($4,'picked_up','Q.3, HCM','Bưu tá nhận hàng','carrier',NOW()-INTERVAL '18 hours')
  `, [ships[0].id,ships[1].id,ships[2].id,ships[3].id])
  console.log('🚚 Shipments:', ships.length)

  // ── SCHEDULED LIVESTREAMS ────────────────────────
  await client.query(`
    INSERT INTO scheduled_livestreams (id,shop_id,title,description,platform,product_ids,script,status,scheduled_at,duration_minutes,created_at,updated_at) VALUES
    ($1,$4,'Sale sữa cuối tuần -20%','Giảm giá sữa bột nhập khẩu','tiktok',$6,E'1. Mở đầu\n2. Giới thiệu SP\n3. Flash sale\n4. Q&A','scheduled',NOW()+INTERVAL '2 days 14 hours',120,NOW(),NOW()),
    ($2,$4,'Review bỉm Merries vs Bobby','So sánh 2 loại bỉm','facebook',$7,NULL,'scheduled',NOW()+INTERVAL '5 days 20 hours',90,NOW(),NOW()),
    ($3,$5,'Đồ hè mới - Siêu cute',NULL,'tiktok',$8,NULL,'scheduled',NOW()+INTERVAL '1 day 19 hours',60,NOW(),NOW())
  `, [randomUUID(),randomUUID(),randomUUID(),String(s1.id),String(s2.id),
      JSON.stringify([prods[0].id,prods[1].id,prods[4].id]),JSON.stringify([prods[2].id]),JSON.stringify([prods[6].id,prods[7].id])])
  console.log('📅 Schedules ✓')

  // ── NOTIFICATIONS ────────────────────────────────
  await client.query(`
    INSERT INTO notifications (user_id,shop_id,type,title,message,link,is_read,created_at,updated_at) VALUES
    ($1,$2,'hot_lead','🔥 Lead HOT mới!','Hoàng Mai Chi hỏi giá sữa Meiji','/live',false,NOW()-INTERVAL '2 hours',NOW()),
    ($1,$2,'low_stock','⚠️ Sắp hết hàng','Johnson Baby còn 8 sp (ngưỡng: 10)','/inventory',false,NOW()-INTERVAL '5 hours',NOW()),
    ($1,$2,'order_created','🧾 Đơn hàng mới','Đơn #1 — Mai Chi — 920,000đ','/orders',true,NOW()-INTERVAL '1 day',NOW()),
    ($1,$2,'shipment_delivered','✅ Giao thành công','GHTK987654321 — Minh Anh','/ship',true,NOW()-INTERVAL '2 days',NOW()),
    ($1,$2,'session_ended','🎬 Live kết thúc','1,250 viewers, 28 HOT leads','/reports',true,NOW()-INTERVAL '1 day',NOW()),
    ($1,$3,'hot_lead','🔥 Lead HOT mới!','Đặng Văn Hùng mua 2 áo bé trai','/live',false,NOW()-INTERVAL '1 hour',NOW())
  `, [u1.id,s1.id,s2.id])
  console.log('🔔 Notifications ✓')

  // ── WEBHOOKS ─────────────────────────────────────
  await client.query(`
    INSERT INTO webhooks (shop_id,url,events,is_active,secret,last_status,created_at,updated_at) VALUES
    ($1,'https://hooks.example.com/live','hot_lead,order_created',true,'whsec_123',NULL,NOW(),NOW()),
    ($1,'https://hooks.example.com/orders','order_created,order_shipped',true,'whsec_456',NULL,NOW(),NOW()),
    ($1,'https://old.example.com/wh','hot_lead',false,'whsec_old',500,NOW()-INTERVAL '30 days',NOW())
  `, [s1.id])
  console.log('🪝 Webhooks ✓')

  // ── ACTIVITY LOGS ────────────────────────────────
  await client.query(`
    INSERT INTO activity_logs (shop_id,user_id,action,entity_type,details,created_at) VALUES
    ($1,$3,'login','user','{"ip":"127.0.0.1"}',NOW()-INTERVAL '2 days'),
    ($1,$3,'start_live','session','{"platform":"tiktok","viewers":1250}',NOW()-INTERVAL '27 hours'),
    ($1,$3,'end_live','session','{"duration":"2h","comments":340}',NOW()-INTERVAL '25 hours'),
    ($1,$3,'create_order','order','{"total":920000}',NOW()-INTERVAL '2 days'),
    ($1,$3,'confirm_order','order',NULL,NOW()-INTERVAL '1 day'),
    ($1,$3,'create_shipment','shipment','{"carrier":"GHN"}',NOW()-INTERVAL '1 day'),
    ($1,$3,'update_product','product','{"field":"stock","from":0,"to":150}',NOW()-INTERVAL '10 days'),
    ($2,$3,'start_live','session',NULL,NOW()-INTERVAL '2 days')
  `, [s1.id,s2.id,u1.id])
  console.log('📋 Activity logs ✓')

  await client.query('COMMIT')

  console.log('\n' + '═'.repeat(50))
  console.log('✨ SEEDER COMPLETED!')
  console.log('═'.repeat(50))
  console.log(`   Login:  demo@demo.com / 123456`)
  console.log(`   Shops:  "${s1.shop_name}", "${s2.shop_name}"`)
  console.log(`   Data:   ${prods.length} products, ${custs.length} customers`)
  console.log(`           ${ords.length} orders, ${ships.length} shipments`)
  console.log(`           ${sessions.length} sessions, ${lc} leads`)
  console.log('═'.repeat(50))

} catch (err) {
  await client.query('ROLLBACK')
  console.error('❌ Failed:', err.message || err)
  if (err.detail) console.error('   Detail:', err.detail)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
