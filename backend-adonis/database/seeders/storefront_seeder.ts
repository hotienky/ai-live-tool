/**
 * Storefront Clothing Seeder
 * Seeds sample clothing data for storefront pages:
 * categories, brands, products (quần áo), banners, CMS pages
 *
 * Usage: node ace db:seed --files database/seeders/storefront_seeder.ts
 */

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class StorefrontSeeder extends BaseSeeder {
  async run() {
    // Use shop_id = 1 (Baby Shop) — we'll update its name
    const shopId = 1

    // Update shop name & add logo
    await db.from('shops').where('id', shopId).update({
      shop_name: 'Fashion Store VN',
      logo: 'https://placehold.co/120x120/7c3aed/ffffff?text=FS',
    })
    console.log('🏪 Updated shop name to "Fashion Store VN"')

    // ═══════════════════════════════════════════════════
    // 1. CATEGORIES
    // ═══════════════════════════════════════════════════
    // Clear existing categories for this shop
    await db.from('product_categories').where('shop_id', shopId).delete()

    const categoryData = [
      { shop_id: shopId, name: 'Áo nam', slug: 'ao-nam', description: 'Áo thun, áo sơ mi, áo polo nam', sort_order: 1, is_active: true, image_url: 'https://placehold.co/400x400/1a1a25/a78bfa?text=Áo+Nam' },
      { shop_id: shopId, name: 'Quần nam', slug: 'quan-nam', description: 'Quần jean, quần kaki, quần short nam', sort_order: 2, is_active: true, image_url: 'https://placehold.co/400x400/1a1a25/a78bfa?text=Quần+Nam' },
      { shop_id: shopId, name: 'Áo nữ', slug: 'ao-nu', description: 'Áo croptop, áo kiểu, áo sơ mi nữ', sort_order: 3, is_active: true, image_url: 'https://placehold.co/400x400/1a1a25/ec4899?text=Áo+Nữ' },
      { shop_id: shopId, name: 'Quần nữ', slug: 'quan-nu', description: 'Quần jean, quần ống rộng, quần short nữ', sort_order: 4, is_active: true, image_url: 'https://placehold.co/400x400/1a1a25/ec4899?text=Quần+Nữ' },
      { shop_id: shopId, name: 'Đầm / Váy', slug: 'dam-vay', description: 'Đầm dự tiệc, váy công sở, đầm suông', sort_order: 5, is_active: true, image_url: 'https://placehold.co/400x400/1a1a25/f59e0b?text=Đầm+Váy' },
      { shop_id: shopId, name: 'Phụ kiện', slug: 'phu-kien', description: 'Mũ, nón, thắt lưng, kính, túi xách', sort_order: 6, is_active: true, image_url: 'https://placehold.co/400x400/1a1a25/10b981?text=Phụ+Kiện' },
    ]
    const catIds = await db.table('product_categories').multiInsert(categoryData).returning('id')
    console.log('📂 Categories seeded:', catIds.length)

    // ═══════════════════════════════════════════════════
    // 2. BRANDS
    // ═══════════════════════════════════════════════════
    await db.from('product_brands').where('shop_id', shopId).delete()

    const brandData = [
      { shop_id: shopId, name: 'Nike', slug: 'nike', description: 'Just Do It', logo_url: 'https://placehold.co/200x80/1a1a25/ffffff?text=NIKE', is_active: true },
      { shop_id: shopId, name: 'Adidas', slug: 'adidas', description: 'Impossible Is Nothing', logo_url: 'https://placehold.co/200x80/1a1a25/ffffff?text=ADIDAS', is_active: true },
      { shop_id: shopId, name: 'Uniqlo', slug: 'uniqlo', description: 'LifeWear', logo_url: 'https://placehold.co/200x80/1a1a25/ffffff?text=UNIQLO', is_active: true },
      { shop_id: shopId, name: 'Zara', slug: 'zara', description: 'Fast Fashion', logo_url: 'https://placehold.co/200x80/1a1a25/ffffff?text=ZARA', is_active: true },
      { shop_id: shopId, name: 'H&M', slug: 'hm', description: 'Fashion & Quality', logo_url: 'https://placehold.co/200x80/1a1a25/ffffff?text=H%26M', is_active: true },
    ]
    const brandIds = await db.table('product_brands').multiInsert(brandData).returning('id')
    console.log('🏷️ Brands seeded:', brandIds.length)

    // ═══════════════════════════════════════════════════
    // 3. PRODUCTS (Clothing)
    // ═══════════════════════════════════════════════════
    await db.from('products').where('shop_id', shopId).delete()

    const products = [
      // Áo nam
      { shop_id: shopId, name: 'Áo Polo Nam Cotton Premium', sku: 'POLO-M-001', price: 350000, cost_price: 180000, stock: 120, category: 'Áo nam', category_id: catIds[0].id, brand_id: brandIds[2].id, slug: 'ao-polo-nam-cotton-premium', description: 'Áo polo nam chất cotton 100%, form regular fit, thoáng mát. Phù hợp đi làm, đi chơi. Size S-XXL.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/a78bfa?text=Polo+Nam', promotion_price: 299000, weight: 250, unit: 'cái', barcode: '8936000000001' },
      { shop_id: shopId, name: 'Áo Thun Oversize Unisex', sku: 'THUN-UNI-001', price: 220000, cost_price: 95000, stock: 250, category: 'Áo nam', category_id: catIds[0].id, brand_id: null, slug: 'ao-thun-oversize-unisex', description: 'Áo thun oversize unisex, chất vải cotton dày dặn, in hình trendy. Form rộng thoải mái.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/60a5fa?text=Oversize', weight: 220, unit: 'cái', barcode: '8936000000002' },
      { shop_id: shopId, name: 'Áo Sơ Mi Trắng Slim Fit', sku: 'SM-TRANG-001', price: 450000, cost_price: 220000, stock: 80, category: 'Áo nam', category_id: catIds[0].id, brand_id: brandIds[3].id, slug: 'ao-so-mi-trang-slim-fit', description: 'Áo sơ mi trắng nam form slim fit, chất vải non-iron, công sở thanh lịch.', is_active: true, is_featured: false, image_url: 'https://placehold.co/600x600/2d2d3f/f0f0f5?text=Sơ+Mi', weight: 200, unit: 'cái', barcode: '8936000000003' },
      { shop_id: shopId, name: 'Áo Hoodie Nike Fleece', sku: 'HOODIE-NK-001', price: 890000, cost_price: 550000, stock: 45, category: 'Áo nam', category_id: catIds[0].id, brand_id: brandIds[0].id, slug: 'ao-hoodie-nike-fleece', description: 'Áo hoodie Nike fleece, giữ ấm tuyệt vời, logo thêu. Phong cách streetwear.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/ef4444?text=Hoodie+Nike', promotion_price: 749000, weight: 450, unit: 'cái', barcode: '8936000000004' },

      // Quần nam
      { shop_id: shopId, name: 'Quần Jean Slim Fit Xanh Đậm', sku: 'JEAN-M-001', price: 550000, cost_price: 280000, stock: 95, category: 'Quần nam', category_id: catIds[1].id, brand_id: brandIds[3].id, slug: 'quan-jean-slim-fit-xanh-dam', description: 'Quần jean nam slim fit, wash xanh đậm cổ điển, cotton pha co giãn thoải mái.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/3b82f6?text=Jean+Slim', weight: 500, unit: 'cái', barcode: '8936000000005' },
      { shop_id: shopId, name: 'Quần Kaki Nam Regular', sku: 'KAKI-M-001', price: 420000, cost_price: 200000, stock: 70, category: 'Quần nam', category_id: catIds[1].id, brand_id: brandIds[2].id, slug: 'quan-kaki-nam-regular', description: 'Quần kaki nam form regular, chất vải kaki cotton mềm, nhiều màu lựa chọn.', is_active: true, image_url: 'https://placehold.co/600x600/2d2d3f/d4a276?text=Kaki+Nam', weight: 400, unit: 'cái', barcode: '8936000000006' },
      { shop_id: shopId, name: 'Quần Short Thể Thao Adidas', sku: 'SHORT-AD-001', price: 380000, cost_price: 190000, stock: 150, category: 'Quần nam', category_id: catIds[1].id, brand_id: brandIds[1].id, slug: 'quan-short-the-thao-adidas', description: 'Quần short thể thao Adidas, vải dri-fit thoáng mát, thích hợp tập gym và chạy bộ.', is_active: true, image_url: 'https://placehold.co/600x600/2d2d3f/22c55e?text=Short+Adidas', promotion_price: 320000, weight: 200, unit: 'cái', barcode: '8936000000007' },

      // Áo nữ
      { shop_id: shopId, name: 'Áo Croptop Nữ Basic', sku: 'CROP-F-001', price: 180000, cost_price: 75000, stock: 200, category: 'Áo nữ', category_id: catIds[2].id, brand_id: brandIds[4].id, slug: 'ao-croptop-nu-basic', description: 'Áo croptop nữ basic, chất cotton mềm, nhiều màu. Dễ phối đồ, phong cách trẻ trung.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/ec4899?text=Croptop', weight: 120, unit: 'cái', barcode: '8936000000008' },
      { shop_id: shopId, name: 'Áo Sơ Mi Nữ Cổ V Lụa', sku: 'SM-LUA-F-001', price: 520000, cost_price: 260000, stock: 55, category: 'Áo nữ', category_id: catIds[2].id, brand_id: brandIds[3].id, slug: 'ao-so-mi-nu-co-v-lua', description: 'Áo sơ mi nữ cổ V chất lụa cao cấp, kiểu dáng thanh lịch. Phù hợp công sở và dự tiệc.', is_active: true, image_url: 'https://placehold.co/600x600/2d2d3f/d946ef?text=Sơ+Mi+Lụa', weight: 180, unit: 'cái', barcode: '8936000000009' },

      // Quần nữ
      { shop_id: shopId, name: 'Quần Jean Ống Rộng Nữ', sku: 'JEAN-F-001', price: 480000, cost_price: 230000, stock: 85, category: 'Quần nữ', category_id: catIds[3].id, brand_id: brandIds[3].id, slug: 'quan-jean-ong-rong-nu', description: 'Quần jean nữ ống rộng, cạp cao tôn dáng, wash xanh nhạt vintage.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/60a5fa?text=Jean+Nữ', weight: 480, unit: 'cái', barcode: '8936000000010' },
      { shop_id: shopId, name: 'Quần Legging Thể Thao Nike', sku: 'LEG-NK-F-001', price: 650000, cost_price: 380000, stock: 60, category: 'Quần nữ', category_id: catIds[3].id, brand_id: brandIds[0].id, slug: 'quan-legging-the-thao-nike', description: 'Quần legging thể thao Nike, chất vải dri-fit co giãn 4 chiều, cạp cao gen bụng.', is_active: true, image_url: 'https://placehold.co/600x600/2d2d3f/ef4444?text=Legging', promotion_price: 550000, weight: 250, unit: 'cái', barcode: '8936000000011' },

      // Đầm / Váy
      { shop_id: shopId, name: 'Đầm Suông Công Sở Thanh Lịch', sku: 'DAM-CS-001', price: 680000, cost_price: 340000, stock: 40, category: 'Đầm / Váy', category_id: catIds[4].id, brand_id: brandIds[3].id, slug: 'dam-suong-cong-so-thanh-lich', description: 'Đầm suông công sở, chất vải cao cấp, form A thanh lịch. Phù hợp văn phòng và dạo phố.', is_active: true, is_featured: true, image_url: 'https://placehold.co/600x600/2d2d3f/f59e0b?text=Đầm+Suông', weight: 300, unit: 'cái', barcode: '8936000000012' },

      // Phụ kiện
      { shop_id: shopId, name: 'Nón Bucket Unisex', sku: 'NON-BK-001', price: 150000, cost_price: 60000, stock: 180, category: 'Phụ kiện', category_id: catIds[5].id, brand_id: null, slug: 'non-bucket-unisex', description: 'Nón bucket unisex, chất vải canvas dày, chống nắng tốt. Phong cách basic phù hợp mọi outfit.', is_active: true, image_url: 'https://placehold.co/600x600/2d2d3f/10b981?text=Bucket+Hat', weight: 100, unit: 'cái', barcode: '8936000000013' },
      { shop_id: shopId, name: 'Thắt Lưng Da Bò Thật', sku: 'BELT-DA-001', price: 280000, cost_price: 130000, stock: 100, category: 'Phụ kiện', category_id: catIds[5].id, brand_id: null, slug: 'that-lung-da-bo-that', description: 'Thắt lưng da bò thật 100%, khóa kim loại cao cấp. Bền đẹp, sang trọng.', is_active: true, image_url: 'https://placehold.co/600x600/2d2d3f/d4a276?text=Belt', weight: 200, unit: 'cái', barcode: '8936000000014' },
    ]

    await db.table('products').multiInsert(products)
    console.log('👕 Products seeded:', products.length)

    // ═══════════════════════════════════════════════════
    // 4. BANNERS
    // ═══════════════════════════════════════════════════
    await db.table('banners').multiInsert([
      { store_id: shopId, title: 'Summer Sale - Giảm đến 50%', description: 'Đón hè rực rỡ với BST mới. Giảm giá lên đến 50% cho tất cả áo thun và quần short.', image: 'https://placehold.co/1400x500/7c3aed/ffffff?text=SUMMER+SALE+50%25+OFF', url: `/${shopId}/products`, sort: 1, status: 1, type: 'main' },
      { store_id: shopId, title: 'New Arrivals - BST Thu Đông 2026', description: 'Hoodie, áo khoác, quần jean mới nhất từ Nike, Adidas, Zara.', image: 'https://placehold.co/1400x500/1a1a25/a78bfa?text=NEW+ARRIVALS+2026', url: `/${shopId}/products`, sort: 2, status: 1, type: 'main' },
      { store_id: shopId, title: 'Free Ship đơn từ 500K', description: 'Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500,000đ.', image: 'https://placehold.co/1400x500/10b981/ffffff?text=FREE+SHIP+500K', sort: 3, status: 1, type: 'main' },
    ])
    console.log('🎫 Banners seeded')

    // ═══════════════════════════════════════════════════
    // 5. CMS PAGES
    // ═══════════════════════════════════════════════════
    await db.table('cms_pages').multiInsert([
      {
        store_id: shopId, title: 'Về Chúng Tôi', alias: 'about-us', sort: 1, status: 1,
        image: 'https://placehold.co/840x360/7c3aed/ffffff?text=About+Us',
        content: `<h2>Fashion Store VN</h2>
<p>Chào mừng bạn đến với <strong>Fashion Store VN</strong> — cửa hàng thời trang trực tuyến hàng đầu Việt Nam.</p>
<p>Chúng tôi mang đến những sản phẩm thời trang chất lượng cao từ các thương hiệu uy tín trên thế giới như Nike, Adidas, Uniqlo, Zara, H&M.</p>
<h3>Cam kết của chúng tôi</h3>
<ul>
<li>✅ Sản phẩm chính hãng 100%</li>
<li>✅ Đổi trả trong 30 ngày</li>
<li>✅ Giao hàng nhanh toàn quốc</li>
<li>✅ Tư vấn size miễn phí</li>
</ul>`
      },
      {
        store_id: shopId, title: 'Chính Sách Đổi Trả', alias: 'return-policy', sort: 2, status: 1,
        content: `<h2>Chính sách đổi trả</h2>
<p>Fashion Store VN cam kết đổi trả hàng trong <strong>30 ngày</strong> kể từ ngày nhận hàng.</p>
<h3>Điều kiện đổi trả</h3>
<ul>
<li>Sản phẩm còn nguyên tem, mác, chưa qua sử dụng</li>
<li>Có hóa đơn mua hàng hoặc mã đơn hàng</li>
<li>Sản phẩm không bị hư hỏng do lỗi người dùng</li>
</ul>
<h3>Quy trình đổi trả</h3>
<ol>
<li>Liên hệ hotline: <strong>0901 234 567</strong></li>
<li>Gửi hàng về địa chỉ kho</li>
<li>Kiểm tra và hoàn tiền trong 3-5 ngày làm việc</li>
</ol>`
      },
      {
        store_id: shopId, title: 'Hướng Dẫn Chọn Size', alias: 'size-guide', sort: 3, status: 1,
        image: 'https://placehold.co/840x360/a855f7/ffffff?text=Size+Guide',
        content: `<h2>Bảng size chuẩn</h2>
<p>Hướng dẫn đo và chọn size phù hợp cho bạn.</p>
<h3>Áo nam/nữ</h3>
<p><strong>S:</strong> 40-55kg, cao 155-165cm<br>
<strong>M:</strong> 55-65kg, cao 160-170cm<br>
<strong>L:</strong> 65-75kg, cao 165-175cm<br>
<strong>XL:</strong> 75-85kg, cao 170-180cm<br>
<strong>XXL:</strong> 85-95kg, cao 175-185cm</p>
<h3>Quần nam/nữ</h3>
<p><strong>28:</strong> vòng eo 70-74cm<br>
<strong>29:</strong> vòng eo 74-78cm<br>
<strong>30:</strong> vòng eo 78-82cm<br>
<strong>31:</strong> vòng eo 82-86cm<br>
<strong>32:</strong> vòng eo 86-90cm</p>
<blockquote>💡 Nếu bạn không chắc chắn về size, hãy inbox chúng tôi kèm số đo để được tư vấn miễn phí!</blockquote>`
      },
    ])
    console.log('📄 CMS Pages seeded')

    console.log('\n✨ Storefront clothing data seeded successfully!')
    console.log('   Shop: Fashion Store VN (ID: 1)')
    console.log('   Visit: http://localhost:5174/1')
  }
}
