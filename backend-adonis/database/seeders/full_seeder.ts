/**
 * Full Seeder — Populates ALL tables with realistic Vietnamese data.
 *
 * Usage:  node ace db:seed
 *         node ace db:seed --files database/seeders/full_seeder.ts
 *
 * ⚠️  This seeder is ADDITIVE by default.
 *     It checks if data exists before inserting to avoid duplicates.
 *     Set SEED_FORCE=1 to wipe and re-seed.
 */

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import {
  UserSchema,
  ShopSchema,
  LivestreamSessionSchema,
  CustomerSchema,
  ChatLogSchema,
  LeadSchema,
  ProductSchema,
  ProductVariantSchema,
  ShopKeywordSchema,
  AutoReplyTemplateSchema,
  NotificationSchema,
  WebhookSchema,
  ActivityLogSchema,
  StockHistorySchema,
  ShipmentSchema,
  ShipmentHistorySchema,
} from '../schema.js'
import Order from '#models/order'
import ScheduledLivestream from '#models/scheduled_livestream'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

export default class FullSeeder extends BaseSeeder {
  async run() {
    const force = process.env.SEED_FORCE === '1'

    // ═══════════════════════════════════════════════════
    // 1. USERS
    // ═══════════════════════════════════════════════════
    const existingUser = await UserSchema.findBy('email', 'demo@demo.com')
    if (force && existingUser) {
      console.log('🧹 Force mode — wiping all seeded data...')
    }
    if (existingUser && !force) {
      console.log('✅ Seed data already exists. Use SEED_FORCE=1 to re-seed.')
      return
    }

    const hashedPw = await hash.make('123456')
    const [user] = await UserSchema.createMany([
      { fullName: 'Demo User', email: 'demo@demo.com', password: hashedPw, role: 'admin' },
      { fullName: 'Nhân viên A', email: 'staff@demo.com', password: hashedPw, role: 'staff' },
    ])
    console.log('👤 Users seeded')

    // ═══════════════════════════════════════════════════
    // 2. SHOPS
    // ═══════════════════════════════════════════════════
    const [shop1, shop2] = await ShopSchema.createMany([
      {
        shopName: 'Baby Shop Sữa Mẹ',
        userId: user.id,
        platform: 'tiktok',
        tiktokUsername: 'babyshop_suame',
        facebookPageId: 'demo_fb_page',
        facebookAccessToken: 'demo_fb_token',
        youtubeChannel: 'UCdemo',
        youtubeApiKey: 'demo_yt_key',
        shopeeShopId: 'shopee_123',
        shopeePartnerId: 'partner_123',
        shopeePartnerKey: 'key_123',
        shopeeShopIdApi: 'api_123',
        isActive: true,
        autoReplyEnabled: true,
        moderationBlacklist: 'spam\nquảng cáo\nfake',
        moderationHideSpam: true,
        moderationRateLimit: true,
        moderationMaxPerMinute: 5,
        shippingConfig: JSON.stringify({
          ghn: { token: 'demo_ghn_token', shopId: '4235123' },
          ghtk: { token: 'demo_ghtk_token' },
          viettel_post: { token: '' },
        }),
        defaultCarrier: 'ghn',
        senderName: 'Baby Shop HCM',
        senderPhone: '0901234567',
        senderAddress: '123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM',
      },
      {
        shopName: 'Thời Trang Trẻ Em',
        userId: user.id,
        platform: 'facebook',
        tiktokUsername: '',
        facebookPageId: 'fb_fashion_page',
        facebookAccessToken: 'demo_fb_token_2',
        isActive: true,
        autoReplyEnabled: false,
        moderationHideSpam: true,
        moderationRateLimit: false,
        moderationMaxPerMinute: 10,
        defaultCarrier: 'manual',
        senderName: 'TT Trẻ Em',
        senderPhone: '0987654321',
        senderAddress: '456 Lê Lợi, Q.3, TP.HCM',
      },
    ])
    console.log('🏪 Shops seeded')

    // ═══════════════════════════════════════════════════
    // 3. PRODUCTS + VARIANTS
    // ═══════════════════════════════════════════════════
    const products = await ProductSchema.createMany([
      {
        shopId: shop1.id, name: 'Sữa Meiji 0-1 tuổi', price: 450000,
        keywords: 'meiji,sữa meiji,meiji 0-1', description: 'Sữa Meiji Nhật Bản cho bé 0-1 tuổi, lon 800g',
        isActive: true, stock: 150, sku: 'MEIJI-01-800', lowStockThreshold: 10,
        costPrice: 380000, category: 'Sữa bột', unit: 'lon', barcode: '8901234567890',
      },
      {
        shopId: shop1.id, name: 'Sữa Nan Optipro 2', price: 520000,
        keywords: 'nan,sữa nan,nan optipro', description: 'Sữa Nan Optipro số 2 cho bé 6-12 tháng',
        isActive: true, stock: 85, sku: 'NAN-02-900', lowStockThreshold: 15,
        costPrice: 430000, category: 'Sữa bột', unit: 'lon', barcode: '8901234567891',
      },
      {
        shopId: shop1.id, name: 'Bỉm Merries size M', price: 320000,
        keywords: 'bỉm,merries,bỉm merries', description: 'Bỉm Merries size M 64 miếng',
        isActive: true, stock: 200, sku: 'MER-M-64', lowStockThreshold: 20,
        costPrice: 260000, category: 'Bỉm tã', unit: 'gói', barcode: '8901234567892',
      },
      {
        shopId: shop1.id, name: 'Bình sữa Pigeon 240ml', price: 185000,
        keywords: 'bình sữa,pigeon,bình pigeon', description: 'Bình sữa Pigeon cổ rộng 240ml',
        isActive: true, stock: 45, sku: 'PIG-240', lowStockThreshold: 10,
        costPrice: 120000, category: 'Phụ kiện', unit: 'cái', barcode: '8901234567893',
      },
      {
        shopId: shop1.id, name: 'Combo Sữa Meiji + Bỉm', price: 720000,
        keywords: 'combo,combo meiji', description: 'Combo tiết kiệm: 1 lon Meiji + 1 gói Merries M',
        isActive: true, stock: 30, sku: 'COMBO-MB-01', lowStockThreshold: 5,
        costPrice: 600000, category: 'Combo', unit: 'bộ',
      },
      {
        shopId: shop1.id, name: 'Sữa tắm Johnson Baby', price: 95000,
        keywords: 'sữa tắm,johnson', description: 'Sữa tắm Johnson Baby 500ml Top-to-Toe',
        isActive: true, stock: 8, sku: 'JB-500', lowStockThreshold: 10,
        costPrice: 65000, category: 'Chăm sóc', unit: 'chai',
      },
      {
        shopId: shop2.id, name: 'Áo thun cho bé trai', price: 120000,
        keywords: 'áo thun,áo bé trai', description: 'Áo thun cotton 100% cho bé 1-5 tuổi',
        isActive: true, stock: 300, sku: 'AT-BOY-01', lowStockThreshold: 30,
        costPrice: 55000, category: 'Áo', unit: 'cái',
      },
      {
        shopId: shop2.id, name: 'Quần short bé gái', price: 95000,
        keywords: 'quần short,quần bé gái', description: 'Quần short jean bé gái 2-6 tuổi',
        isActive: true, stock: 0, sku: 'QS-GIRL-01', lowStockThreshold: 20,
        costPrice: 40000, category: 'Quần', unit: 'cái',
      },
    ])

    // Product Variants
    await ProductVariantSchema.createMany([
      { productId: products[0].id, name: 'Lon 400g', sku: 'MEIJI-01-400', price: 250000, costPrice: 200000, stock: 50, attributes: JSON.stringify({ size: '400g' }), isActive: true },
      { productId: products[0].id, name: 'Lon 800g', sku: 'MEIJI-01-800V', price: 450000, costPrice: 380000, stock: 100, attributes: JSON.stringify({ size: '800g' }), isActive: true },
      { productId: products[6].id, name: 'Size 1 (9-12m)', sku: 'AT-BOY-01-S1', price: 110000, costPrice: 50000, stock: 80, attributes: JSON.stringify({ size: 'S1', color: 'Xanh' }), isActive: true },
      { productId: products[6].id, name: 'Size 2 (1-2 tuổi)', sku: 'AT-BOY-01-S2', price: 120000, costPrice: 55000, stock: 120, attributes: JSON.stringify({ size: 'S2', color: 'Xanh' }), isActive: true },
      { productId: products[6].id, name: 'Size 3 (3-5 tuổi)', sku: 'AT-BOY-01-S3', price: 130000, costPrice: 60000, stock: 100, attributes: JSON.stringify({ size: 'S3', color: 'Trắng' }), isActive: true },
    ])

    // Stock History
    await StockHistorySchema.createMany([
      { productId: products[0].id, shopId: shop1.id, userId: user.id, action: 'add' as const, quantityChange: 150, stockBefore: 0, stockAfter: 150, reason: 'Nhập kho lần đầu', referenceType: 'import' as const },
      { productId: products[1].id, shopId: shop1.id, userId: user.id, action: 'add' as const, quantityChange: 100, stockBefore: 0, stockAfter: 100, reason: 'Nhập kho lần đầu', referenceType: 'import' as const },
      { productId: products[1].id, shopId: shop1.id, userId: user.id, action: 'deduct' as const, quantityChange: -15, stockBefore: 100, stockAfter: 85, reason: 'Bán qua live', referenceType: 'order' as const, referenceId: 1 },
      { productId: products[5].id, shopId: shop1.id, userId: user.id, action: 'deduct' as const, quantityChange: -42, stockBefore: 50, stockAfter: 8, reason: 'Bán hàng tuần 1/3', referenceType: 'manual' as const },
    ])
    console.log('📦 Products, Variants & Stock History seeded')

    // ═══════════════════════════════════════════════════
    // 4. KEYWORDS
    // ═══════════════════════════════════════════════════
    await ShopKeywordSchema.createMany([
      { shopId: shop1.id, keyword: 'mua', alertType: 'highlight', color: '#ff3b5c', isActive: true },
      { shopId: shop1.id, keyword: 'giá', alertType: 'highlight', color: '#f59e0b', isActive: true },
      { shopId: shop1.id, keyword: 'đặt hàng', alertType: 'auto_reply', color: '#10b981', autoReplyText: 'Dạ chị ơi, mình inbox chị ngay nhé! 💚', isActive: true },
      { shopId: shop1.id, keyword: 'ship', alertType: 'highlight', color: '#3b82f6', isActive: true },
      { shopId: shop1.id, keyword: 'combo', alertType: 'auto_reply', color: '#8b5cf6', autoReplyText: 'Combo đang giảm 15% ạ! Mình inbox chi tiết ngay nhé 🎉', isActive: true },
      { shopId: shop1.id, keyword: 'sdt', alertType: 'highlight', color: '#ef4444', isActive: true },
      { shopId: shop2.id, keyword: 'size', alertType: 'highlight', color: '#06b6d4', isActive: true },
      { shopId: shop2.id, keyword: 'mẫu mới', alertType: 'highlight', color: '#ec4899', isActive: true },
    ])
    console.log('🔑 Keywords seeded')

    // ═══════════════════════════════════════════════════
    // 5. AUTO-REPLY TEMPLATES
    // ═══════════════════════════════════════════════════
    await AutoReplyTemplateSchema.createMany([
      { shopId: shop1.id, triggerLabel: 'HOT', templateText: 'Cảm ơn {{nickname}} quan tâm ạ! Mình inbox bạn ngay nhé 💌', isActive: true },
      { shopId: shop1.id, triggerLabel: 'HOT', templateText: 'Dạ {{nickname}} ơi, sản phẩm còn hàng ạ! Mình tư vấn chi tiết qua inbox nha 🛒', isActive: true },
      { shopId: shop1.id, triggerLabel: 'WARM', templateText: 'Chào {{nickname}}! Bạn muốn mình tư vấn thêm không ạ? 😊', isActive: true },
      { shopId: shop1.id, triggerLabel: 'keyword', templateText: 'Cảm ơn {{nickname}}! Shop đang có chương trình ưu đãi đặc biệt nhé 🎁', isActive: true },
      { shopId: shop2.id, triggerLabel: 'HOT', templateText: 'Hi {{nickname}}! Inbox mình ngay để được tư vấn size nhé ❤️', isActive: true },
    ])
    console.log('💬 Auto-reply templates seeded')

    // ═══════════════════════════════════════════════════
    // 6. CUSTOMERS
    // ═══════════════════════════════════════════════════
    const customerNames = [
      { nickname: 'Hoàng Mai Chi', uniqueId: 'hoangmaichi_99' },
      { nickname: 'Đỗ Ngọc Lan', uniqueId: 'ngoclan.do' },
      { nickname: 'Vũ Thu Hương', uniqueId: 'thuhuong.vu' },
      { nickname: 'Phạm Thanh Hà', uniqueId: 'thanhha.pham' },
      { nickname: 'Lê Thùy Trang', uniqueId: 'thuytrang.le' },
      { nickname: 'Trần Minh Anh', uniqueId: 'minhanh.tran' },
      { nickname: 'Nguyễn Thị Hoa', uniqueId: 'thihoa.nguyen' },
      { nickname: 'Bùi Thanh Nhàn', uniqueId: 'thanhnhan.bui' },
      { nickname: 'Ngô Thị Kim', uniqueId: 'thikim.ngo' },
      { nickname: 'Hồ Phương Linh', uniqueId: 'phuonglinh.ho' },
      { nickname: 'Đặng Văn Hùng', uniqueId: 'vanhung.dang' },
      { nickname: 'Lý Minh Tuấn', uniqueId: 'minhtuan.ly' },
    ]

    const customers = await CustomerSchema.createMany(
      customerNames.map((c, i) => ({
        uniqueId: c.uniqueId,
        nickname: c.nickname,
        platform: i % 2 === 0 ? 'tiktok' : 'facebook',
        totalComments: 5 + Math.floor(Math.random() * 30),
        hotCount: Math.floor(Math.random() * 5),
        lastLabel: ['[HOT]', '[WARM]', '[COLD]', '[HOT]'][i % 4],
        shopId: i < 8 ? shop1.id : shop2.id,
        tags: JSON.stringify(i < 4 ? ['VIP', 'Khách quen'] : ['Mới']),
        notes: i === 0 ? 'Khách VIP, mua hàng thường xuyên' : null,
      }))
    )
    console.log('👥 Customers seeded')

    // ═══════════════════════════════════════════════════
    // 7. LIVESTREAM SESSIONS
    // ═══════════════════════════════════════════════════
    const now = DateTime.now()
    const sessions = await LivestreamSessionSchema.createMany([
      {
        shopId: shop1.id, platform: 'tiktok', roomId: 'room_1001', title: 'Live bán sữa Meiji giá sốc!',
        status: 'ended', viewerCount: 1250, commentCount: 340, hotLeadCount: 28,
        startedAt: now.minus({ days: 1, hours: 3 }), endedAt: now.minus({ days: 1, hours: 1 }),
      },
      {
        shopId: shop1.id, platform: 'tiktok', roomId: 'room_1002', title: 'Flash sale Bỉm Merries + Quà tặng',
        status: 'ended', viewerCount: 890, commentCount: 215, hotLeadCount: 15,
        startedAt: now.minus({ days: 3 }), endedAt: now.minus({ days: 3 }).plus({ hours: 2 }),
      },
      {
        shopId: shop1.id, platform: 'facebook', roomId: 'fb_live_001', title: 'Review sữa mới nhất 2026',
        status: 'ended', viewerCount: 560, commentCount: 142, hotLeadCount: 12,
        startedAt: now.minus({ days: 7 }), endedAt: now.minus({ days: 7 }).plus({ hours: 1, minutes: 30 }),
      },
      {
        shopId: shop2.id, platform: 'tiktok', roomId: 'room_2001', title: 'Đồ hè bé trai - Giảm 30%',
        status: 'ended', viewerCount: 420, commentCount: 95, hotLeadCount: 8,
        startedAt: now.minus({ days: 2 }), endedAt: now.minus({ days: 2 }).plus({ hours: 1 }),
      },
    ])
    console.log('🎬 Livestream sessions seeded')

    // ═══════════════════════════════════════════════════
    // 8. CHAT LOGS + LEADS
    // ═══════════════════════════════════════════════════
    const commentPool = [
      { text: 'Sữa Meiji giá bao nhiêu vậy chị? Có combo nào rẻ hơn không?', label: '[HOT]', product: 'Sữa Meiji 0-1' },
      { text: 'Bé nhà mình 8kg, 5 tháng tuổi thì nên dùng size nào vậy ạ?', label: '[WARM]', product: 'Bỉm Merries' },
      { text: 'Bình sữa này chất liệu gì vậy mẹ? Có chứa BPA không?', label: '[WARM]', product: 'Bình sữa Pigeon' },
      { text: 'Đặt cho mình bộ đồ sơ sinh nhé, giao nhanh giúp. SĐT: 0912345678', label: '[HOT]', product: null },
      { text: 'Mình muốn mua 3 hộp sữa, ship về Đà Nẵng bao nhiêu tiền vậy?', label: '[HOT]', product: 'Sữa Meiji 0-1' },
      { text: 'Chốt cho mình 1 bộ quần áo size 80 và 1 bình sữa nhé. SĐT: 0911222333', label: '[HOT]', product: 'Combo' },
      { text: 'Sữa này bé nhà mình 6 tháng dùng size nào? SĐT: 0901234567', label: '[HOT]', product: 'Sữa Nan' },
      { text: 'Cho mình hỏi bỉm này có mấy size vậy? Bé nhà mình 10kg dùng được không?', label: '[WARM]', product: 'Bỉm Merries' },
      { text: 'Sữa này cách pha như thế nào ạ? Bé nhà mình hay bị đầy bụng', label: '[COLD]', product: 'Sữa Meiji 0-1' },
      { text: 'Tã dán này giá bao nhiêu vậy chị? Có combo nào rẻ hơn không ạ?', label: '[HOT]', product: 'Bỉm Merries' },
      { text: 'Quá đẹp luôn, cho mình đặt 2 bộ size 90 luôn nhé!', label: '[HOT]', product: 'Áo thun bé trai' },
      { text: 'Hàng có sẵn không ạ? Ship Hà Nội mất mấy ngày?', label: '[WARM]', product: null },
      { text: 'Xin chào shop!', label: '[COLD]', product: null },
      { text: 'Mình theo dõi shop từ lâu r, hôm nay mới có dịp mua 😍', label: '[WARM]', product: null },
      { text: 'Giá sốc quá, chốt ngay 5 hộp sữa + 3 gói bỉm. Inbox mình nha! SĐT: 0905111222', label: '[HOT]', product: 'Combo Sữa + Bỉm' },
    ]

    const chatLogs: any[] = []
    const leads: any[] = []
    const pipelineStatuses = ['new', 'contacted', 'negotiating', 'won', 'lost']

    for (let i = 0; i < commentPool.length; i++) {
      const c = commentPool[i]
      const custIdx = i % customers.length
      const sessionIdx = i < 10 ? 0 : (i < 12 ? 1 : (i < 14 ? 2 : 3))

      chatLogs.push({
        shopId: sessionIdx < 3 ? shop1.id : shop2.id,
        sessionId: sessions[sessionIdx].id,
        customerId: customers[custIdx].id,
        uniqueId: customers[custIdx].uniqueId,
        nickname: customers[custIdx].nickname,
        commentText: c.text,
        aiLabel: c.label,
        aiSummary: c.label === '[HOT]' ? 'Khách hàng có ý định mua rõ ràng' : c.label === '[WARM]' ? 'Đang tìm hiểu sản phẩm' : 'Chưa có ý định rõ ràng',
        productIntent: c.product,
        platform: sessionIdx < 3 ? (sessionIdx === 2 ? 'facebook' : 'tiktok') : 'tiktok',
      })

      if (c.label !== '[COLD]') {
        leads.push({
          customerId: customers[custIdx].id,
          uniqueId: customers[custIdx].uniqueId,
          nickname: customers[custIdx].nickname,
          comment: c.text,
          label: c.label,
          status: pipelineStatuses[i % pipelineStatuses.length],
          productIntent: c.product,
          notes: c.label === '[HOT]' ? 'Cần liên hệ ngay' : null,
        })
      }
    }
    const createdChatLogs = await ChatLogSchema.createMany(chatLogs)

    // Link chatLogIds to leads
    let chatIdx = 0
    for (let i = 0; i < leads.length; i++) {
      while (chatIdx < createdChatLogs.length && chatLogs[chatIdx].aiLabel === '[COLD]') chatIdx++
      if (chatIdx < createdChatLogs.length) {
        leads[i].chatLogId = createdChatLogs[chatIdx].id
        chatIdx++
      }
    }
    await LeadSchema.createMany(leads)
    console.log('💬 ChatLogs & Leads seeded')

    // ═══════════════════════════════════════════════════
    // 9. ORDERS
    // ═══════════════════════════════════════════════════
    const orderStatuses = ['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    const paymentStatuses = ['unpaid', 'paid', 'refunded']
    const paymentMethods = ['cod', 'bank_transfer', 'momo', null]
    const orders = await Order.createMany([
      {
        shopId: shop1.id, sessionId: sessions[0].id, customerId: customers[0].id,
        customerName: 'Hoàng Mai Chi', customerPhone: '0912345678', customerAddress: '12 Lê Lợi, Q.1, TP.HCM',
        status: 'confirmed', totalAmount: 920000, paymentMethod: 'bank_transfer', paymentStatus: 'paid',
        items: JSON.stringify([
          { productId: products[0].id, name: 'Sữa Meiji 0-1', qty: 1, price: 450000 },
          { productId: products[2].id, name: 'Bỉm Merries M', qty: 1, price: 320000 },
          { productId: products[3].id, name: 'Bình sữa Pigeon', qty: 1, price: 185000 },
        ]),
        confirmedAt: now.minus({ days: 1 }),
        notes: 'Giao trước 5h chiều',
      },
      {
        shopId: shop1.id, sessionId: sessions[0].id, customerId: customers[4].id,
        customerName: 'Lê Thùy Trang', customerPhone: '0905111222', customerAddress: '45 Trần Phú, Đà Nẵng',
        status: 'shipped', totalAmount: 1350000, paymentMethod: 'cod', paymentStatus: 'unpaid',
        items: JSON.stringify([
          { productId: products[0].id, name: 'Sữa Meiji 0-1', qty: 3, price: 450000 },
        ]),
        confirmedAt: now.minus({ days: 2 }), shippedAt: now.minus({ days: 1 }),
        trackingNumber: 'GHN123456789',
      },
      {
        shopId: shop1.id, sessionId: sessions[1].id, customerId: customers[5].id,
        customerName: 'Trần Minh Anh', customerPhone: '0911222333', customerAddress: '78 Hai Bà Trưng, Q.3, TP.HCM',
        status: 'delivered', totalAmount: 405000, paymentMethod: 'momo', paymentStatus: 'paid',
        items: JSON.stringify([
          { productId: products[2].id, name: 'Bỉm Merries M', qty: 1, price: 320000 },
          { productId: products[5].id, name: 'Sữa tắm Johnson', qty: 1, price: 95000 },
        ]),
        confirmedAt: now.minus({ days: 5 }), shippedAt: now.minus({ days: 4 }), deliveredAt: now.minus({ days: 2 }),
        trackingNumber: 'GHTK987654321',
      },
      {
        shopId: shop1.id, customerId: customers[6].id,
        customerName: 'Nguyễn Thị Hoa', customerPhone: '0901234567',
        status: 'draft', totalAmount: 520000, paymentStatus: 'unpaid',
        items: JSON.stringify([
          { productId: products[1].id, name: 'Sữa Nan Optipro 2', qty: 1, price: 520000 },
        ]),
        notes: 'Auto-created from live comment',
      },
      {
        shopId: shop1.id, customerId: customers[9].id,
        customerName: 'Hồ Phương Linh', customerPhone: '0908765432', customerAddress: '99 Nguyễn Văn Cừ, Q.5, TP.HCM',
        status: 'pending', totalAmount: 720000, paymentMethod: 'bank_transfer', paymentStatus: 'unpaid',
        items: JSON.stringify([
          { productId: products[4].id, name: 'Combo Sữa + Bỉm', qty: 1, price: 720000 },
        ]),
      },
      {
        shopId: shop1.id, customerId: customers[3].id,
        customerName: 'Phạm Thanh Hà', customerPhone: '0912345679',
        status: 'cancelled', totalAmount: 185000, paymentStatus: 'refunded', paymentMethod: 'momo',
        items: JSON.stringify([
          { productId: products[3].id, name: 'Bình sữa Pigeon', qty: 1, price: 185000 },
        ]),
        notes: 'Khách hủy - đổi ý',
      },
      {
        shopId: shop2.id, sessionId: sessions[3].id, customerId: customers[10].id,
        customerName: 'Đặng Văn Hùng', customerPhone: '0977888999', customerAddress: '15 Lê Duẩn, Hà Nội',
        status: 'confirmed', totalAmount: 240000, paymentMethod: 'cod', paymentStatus: 'unpaid',
        items: JSON.stringify([
          { productId: products[6].id, name: 'Áo thun bé trai', qty: 2, price: 120000 },
        ]),
        confirmedAt: now.minus({ days: 1 }),
      },
      {
        shopId: shop1.id, customerId: customers[7].id,
        customerName: 'Bùi Thanh Nhàn', customerPhone: '0966777888', customerAddress: '200 CMT8, Q.3, TP.HCM',
        status: 'draft', totalAmount: 450000, paymentStatus: 'unpaid',
        items: JSON.stringify([
          { productId: products[0].id, name: 'Sữa Meiji 0-1', qty: 1, price: 450000 },
        ]),
        notes: 'Auto-created from live comment',
      },
    ])
    console.log('🧾 Orders seeded')

    // ═══════════════════════════════════════════════════
    // 10. SHIPMENTS + SHIPMENT HISTORY
    // ═══════════════════════════════════════════════════
    const shipments = await ShipmentSchema.createMany([
      {
        orderId: orders[1].id, shopId: shop1.id, carrier: 'ghn',
        trackingCode: 'GHN123456789', status: 'in_transit',
        senderName: 'Baby Shop HCM', senderPhone: '0901234567', senderAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
        senderDistrict: 'Quận 1', senderProvince: 'TP.HCM',
        receiverName: 'Lê Thùy Trang', receiverPhone: '0905111222', receiverAddress: '45 Trần Phú, Đà Nẵng',
        receiverDistrict: 'Hải Châu', receiverProvince: 'Đà Nẵng',
        shippingFee: 35000, codAmount: 1350000, insuranceFee: 5000, weight: 2500,
        carrierOrderCode: 'GHN-ORD-001', carrierStatus: 'delivering',
        estimatedDeliveryAt: now.plus({ days: 1 }),
      },
      {
        orderId: orders[2].id, shopId: shop1.id, carrier: 'ghtk',
        trackingCode: 'GHTK987654321', status: 'delivered',
        senderName: 'Baby Shop HCM', senderPhone: '0901234567', senderAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
        senderDistrict: 'Quận 1', senderProvince: 'TP.HCM',
        receiverName: 'Trần Minh Anh', receiverPhone: '0911222333', receiverAddress: '78 Hai Bà Trưng, Q.3, TP.HCM',
        receiverDistrict: 'Quận 3', receiverProvince: 'TP.HCM',
        shippingFee: 22000, codAmount: 0, insuranceFee: 0, weight: 1200,
        carrierOrderCode: 'GHTK-ORD-001', carrierStatus: 'delivered',
        deliveredAt: now.minus({ days: 2 }),
      },
      {
        orderId: orders[0].id, shopId: shop1.id, carrier: 'ghn',
        trackingCode: 'GHN111222333', status: 'pending',
        senderName: 'Baby Shop HCM', senderPhone: '0901234567', senderAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
        senderDistrict: 'Quận 1', senderProvince: 'TP.HCM',
        receiverName: 'Hoàng Mai Chi', receiverPhone: '0912345678', receiverAddress: '12 Lê Lợi, Q.1, TP.HCM',
        receiverDistrict: 'Quận 1', receiverProvince: 'TP.HCM',
        shippingFee: 18000, codAmount: 0, insuranceFee: 0, weight: 3000,
        carrierOrderCode: 'GHN-ORD-002',
      },
      {
        orderId: orders[6].id, shopId: shop2.id, carrier: 'viettel_post',
        trackingCode: 'VP555666777', status: 'picked_up',
        senderName: 'TT Trẻ Em', senderPhone: '0987654321', senderAddress: '456 Lê Lợi, Q.3, TP.HCM',
        senderDistrict: 'Quận 3', senderProvince: 'TP.HCM',
        receiverName: 'Đặng Văn Hùng', receiverPhone: '0977888999', receiverAddress: '15 Lê Duẩn, Hà Nội',
        receiverDistrict: 'Hoàn Kiếm', receiverProvince: 'Hà Nội',
        shippingFee: 40000, codAmount: 240000, insuranceFee: 3000, weight: 500,
        carrierOrderCode: 'VP-ORD-001', carrierStatus: 'picking',
        estimatedDeliveryAt: now.plus({ days: 3 }),
      },
      {
        orderId: orders[4].id, shopId: shop1.id, carrier: 'manual',
        status: 'draft',
        senderName: 'Baby Shop HCM', senderPhone: '0901234567', senderAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
        receiverName: 'Hồ Phương Linh', receiverPhone: '0908765432', receiverAddress: '99 Nguyễn Văn Cừ, Q.5, TP.HCM',
        shippingFee: 0, codAmount: 0, insuranceFee: 0, weight: 2000,
      },
    ])

    // Shipment History
    await ShipmentHistorySchema.createMany([
      { shipmentId: shipments[0].id, status: 'pending', description: 'Đơn hàng đã tạo', source: 'system' },
      { shipmentId: shipments[0].id, status: 'picked_up', location: 'Q.1, TP.HCM', description: 'Shipper đã lấy hàng', source: 'carrier' },
      { shipmentId: shipments[0].id, status: 'in_transit', location: 'Kho trung chuyển HCM', description: 'Hàng đang vận chuyển ra Đà Nẵng', source: 'carrier' },
      { shipmentId: shipments[1].id, status: 'pending', description: 'Đơn hàng đã tạo', source: 'system' },
      { shipmentId: shipments[1].id, status: 'picked_up', location: 'Q.1, TP.HCM', description: 'Đã lấy hàng', source: 'carrier' },
      { shipmentId: shipments[1].id, status: 'in_transit', location: 'Nội thành HCM', description: 'Đang giao nội thành', source: 'carrier' },
      { shipmentId: shipments[1].id, status: 'delivered', location: 'Q.3, TP.HCM', description: 'Giao thành công — người nhận ký', source: 'carrier' },
      { shipmentId: shipments[2].id, status: 'pending', description: 'Đơn hàng chờ lấy', source: 'system' },
      { shipmentId: shipments[3].id, status: 'pending', description: 'Đã tạo vận đơn Viettel Post', source: 'system' },
      { shipmentId: shipments[3].id, status: 'picked_up', location: 'Q.3, TP.HCM', description: 'Bưu tá đã nhận hàng', source: 'carrier' },
    ])
    console.log('🚚 Shipments & History seeded')

    // ═══════════════════════════════════════════════════
    // 11. SCHEDULED LIVESTREAMS
    // ═══════════════════════════════════════════════════
    await ScheduledLivestream.createMany([
      {
        id: randomUUID(), shopId: String(shop1.id), title: 'Sale sữa cuối tuần - Giảm 20%',
        description: 'Giảm giá toàn bộ sữa bột nhập khẩu, free ship từ 500k',
        platform: 'tiktok', productIds: JSON.stringify([products[0].id, products[1].id, products[4].id]),
        script: '1. Mở đầu: Chào mọi người! Hôm nay sale sốc!\n2. Giới thiệu Meiji → NAN → Combo\n3. Đếm ngược flash sale\n4. Q&A từ chat\n5. Kết: Cảm ơn & reminder follow',
        status: 'scheduled', scheduledAt: now.plus({ days: 2, hours: 14 }), durationMinutes: 120,
      },
      {
        id: randomUUID(), shopId: String(shop1.id), title: 'Review bỉm Merries vs Bobby',
        description: 'So sánh chi tiết 2 loại bỉm phổ biến nhất',
        platform: 'facebook', productIds: JSON.stringify([products[2].id]),
        status: 'scheduled', scheduledAt: now.plus({ days: 5, hours: 20 }), durationMinutes: 90,
      },
      {
        id: randomUUID(), shopId: String(shop2.id), title: 'Đồ hè mới về - Siêu cute',
        platform: 'tiktok', productIds: JSON.stringify([products[6].id, products[7].id]),
        status: 'scheduled', scheduledAt: now.plus({ days: 1, hours: 19 }), durationMinutes: 60,
      },
    ])
    console.log('📅 Scheduled livestreams seeded')

    // ═══════════════════════════════════════════════════
    // 12. NOTIFICATIONS
    // ═══════════════════════════════════════════════════
    await NotificationSchema.createMany([
      { userId: user.id, shopId: String(shop1.id), type: 'hot_lead', title: '🔥 Lead HOT mới!', message: 'Hoàng Mai Chi hỏi giá sữa Meiji, có SĐT kèm theo', link: '/live', isRead: false },
      { userId: user.id, shopId: String(shop1.id), type: 'low_stock', title: '⚠️ Sắp hết hàng', message: 'Sữa tắm Johnson Baby còn 8 sản phẩm (ngưỡng: 10)', link: '/inventory', isRead: false },
      { userId: user.id, shopId: String(shop1.id), type: 'order_created', title: '🧾 Đơn hàng mới', message: 'Đơn #1 — Hoàng Mai Chi — 920,000đ', link: '/orders', isRead: true },
      { userId: user.id, shopId: String(shop1.id), type: 'shipment_delivered', title: '✅ Giao thành công', message: 'Đơn GHTK987654321 đã giao — Trần Minh Anh', link: '/ship', isRead: true },
      { userId: user.id, shopId: String(shop1.id), type: 'session_ended', title: '🎬 Phiên live kết thúc', message: 'Live "Bán sữa Meiji giá sốc" — 1,250 viewers, 28 HOT leads', link: '/reports', isRead: true },
      { userId: user.id, shopId: String(shop2.id), type: 'hot_lead', title: '🔥 Lead HOT mới!', message: 'Đặng Văn Hùng muốn mua 2 bộ áo thun bé trai', link: '/live', isRead: false },
    ])
    console.log('🔔 Notifications seeded')

    // ═══════════════════════════════════════════════════
    // 13. WEBHOOKS
    // ═══════════════════════════════════════════════════
    await WebhookSchema.createMany([
      { shopId: shop1.id, url: 'https://hooks.example.com/live-events', events: 'hot_lead,order_created', isActive: true, secret: 'whsec_demo123' },
      { shopId: shop1.id, url: 'https://hooks.example.com/orders', events: 'order_created,order_shipped', isActive: true, secret: 'whsec_demo456' },
      { shopId: shop1.id, url: 'https://old.example.com/webhook', events: 'hot_lead', isActive: false, secret: 'whsec_old', lastStatus: 500 },
    ])
    console.log('🪝 Webhooks seeded')

    // ═══════════════════════════════════════════════════
    // 14. ACTIVITY LOGS
    // ═══════════════════════════════════════════════════
    await ActivityLogSchema.createMany([
      { shopId: shop1.id, userId: user.id, action: 'login', entityType: 'user', details: JSON.stringify({ ip: '127.0.0.1' }) },
      { shopId: shop1.id, userId: user.id, action: 'start_live', entityType: 'session', entityId: sessions[0].id, details: JSON.stringify({ platform: 'tiktok', viewers: 1250 }) },
      { shopId: shop1.id, userId: user.id, action: 'end_live', entityType: 'session', entityId: sessions[0].id, details: JSON.stringify({ duration: '2h', comments: 340 }) },
      { shopId: shop1.id, userId: user.id, action: 'create_order', entityType: 'order', entityId: orders[0].id, details: JSON.stringify({ total: 920000 }) },
      { shopId: shop1.id, userId: user.id, action: 'confirm_order', entityType: 'order', entityId: orders[0].id },
      { shopId: shop1.id, userId: user.id, action: 'create_shipment', entityType: 'shipment', entityId: shipments[0].id, details: JSON.stringify({ carrier: 'GHN' }) },
      { shopId: shop1.id, userId: user.id, action: 'update_product', entityType: 'product', entityId: products[0].id, details: JSON.stringify({ field: 'stock', from: 0, to: 150 }) },
      { shopId: shop1.id, userId: user.id, action: 'add_keyword', entityType: 'keyword', details: JSON.stringify({ keyword: 'mua' }) },
      { shopId: shop2.id, userId: user.id, action: 'start_live', entityType: 'session', entityId: sessions[3].id },
    ])
    console.log('📋 Activity logs seeded')

    console.log('\n✨ Full seeder completed! All tables populated.')
    console.log(`   Login: demo@demo.com / 123456`)
    console.log(`   Shops: "${shop1.shopName}", "${shop2.shopName}"`)
  }
}
