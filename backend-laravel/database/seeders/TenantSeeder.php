<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;

/**
 * TenantSeeder — Seeds comprehensive data for a tenant database.
 *
 * Usage:
 *   docker compose exec backend php artisan db:seed --class=TenantSeeder
 *
 * Set TENANT_DB env variable to specify which tenant DB to seed:
 *   TENANT_DB=tenant_cucai docker compose exec backend php artisan db:seed --class=TenantSeeder
 */
class TenantSeeder extends Seeder
{
    public function run(): void
    {
        // Switch default pgsql connection to tenant database
        $tenantDb = env('TENANT_DB', 'tenant_cucai');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        echo "🔌 Connected to tenant DB: {$tenantDb}\n";

        $db = DB::connection('pgsql');

        // Reset seeded data for fresh seed
        echo "🗑️  Clearing old seeded data...\n";
        $db->table('flash_sale_items')->delete();
        $db->table('flash_sales')->delete();
        $db->table('product_variants')->delete();
        $db->table('order_details')->delete();
        $db->table('orders')->delete();
        $db->table('leads')->delete();
        $db->table('notifications')->delete();
        $db->table('nav_links')->delete();
        $db->table('banners')->delete();
        $db->table('cms_pages')->delete();
        $db->table('customers')->delete();
        $db->table('products')->delete();
        $db->table('product_brands')->delete();
        $db->table('product_categories')->delete();

        // ═══════════════════════════════
        // Categories
        // ═══════════════════════════════
        $categoryIds = [];
        $cats = [
            ['name' => 'Đèn Livestream', 'slug' => 'den-livestream', 'description' => 'Các loại đèn LED chuyên dụng cho livestream', 'sort_order' => 1, 'is_active' => true],
            ['name' => 'Phụ kiện điện thoại', 'slug' => 'phu-kien-dien-thoai', 'description' => 'Giá đỡ, tripod, mic cho điện thoại', 'sort_order' => 2, 'is_active' => true],
            ['name' => 'Thiết bị âm thanh', 'slug' => 'thiet-bi-am-thanh', 'description' => 'Mic, loa, tai nghe chất lượng cao', 'sort_order' => 3, 'is_active' => true],
            ['name' => 'Phông nền', 'slug' => 'phong-nen', 'description' => 'Phông nền xanh, trắng, tùy chỉnh', 'sort_order' => 4, 'is_active' => true],
            ['name' => 'Camera & Webcam', 'slug' => 'camera-webcam', 'description' => 'Camera chất lượng cao cho streaming', 'sort_order' => 5, 'is_active' => true],
        ];
        foreach ($cats as $c) {
            $c['created_at'] = $c['updated_at'] = now();
            $categoryIds[] = $db->table('product_categories')->insertGetId($c);
        }

        // ═══════════════════════════════
        // Brands
        // ═══════════════════════════════
        $brandIds = [];
        $brands = [
            ['name' => 'CUCAI Studio', 'slug' => 'cucai-studio', 'description' => 'Thương hiệu chính hãng CUCAI', 'is_active' => true],
            ['name' => 'ProLight', 'slug' => 'prolight', 'description' => 'Đèn chuyên nghiệp hàng đầu', 'is_active' => true],
            ['name' => 'SoundMax', 'slug' => 'soundmax', 'description' => 'Thiết bị âm thanh cao cấp', 'is_active' => true],
            ['name' => 'StreamGear', 'slug' => 'streamgear', 'description' => 'Phụ kiện streaming đa năng', 'is_active' => true],
        ];
        foreach ($brands as $b) {
            $b['created_at'] = $b['updated_at'] = now();
            $brandIds[] = $db->table('product_brands')->insertGetId($b);
        }

        // ═══════════════════════════════
        // Products
        // ═══════════════════════════════
        $imgBase = '/storage/products';
        $productIds = [];
        {
            $products = [
                [
                    'name' => 'Đèn Ring Light 18 inch',
                    'sku' => 'ring-light-18',
                    'slug' => 'den-ring-light-18-inch',
                    'price' => 450000,
                    'cost_price' => 280000,
                    'promotion_price' => 389000,
                    'promotion_start' => now()->subDays(1),
                    'promotion_end' => now()->addDays(30),
                    'image_url' => "{$imgBase}/ring-light.png",
                    'images' => json_encode(["{$imgBase}/ring-light.png", "{$imgBase}/led-panel.png", "{$imgBase}/softbox.png"]),
                    'description' => '<h2>Đèn Ring Light 18 inch chuyên nghiệp</h2><p>Đèn ring light 18 inch với 3 chế độ ánh sáng (trắng, vàng, trung tính), điều chỉnh độ sáng từ 1-100%. Thích hợp cho livestream, makeup, chụp ảnh sản phẩm.</p><ul><li>Đường kính: 18 inch (45cm)</li><li>Công suất: 48W</li><li>3200K-5600K</li><li>Tripod cao 2.1m</li></ul>',
                    'category' => 'Đèn Livestream',
                    'category_id' => $categoryIds[0] ?? null,
                    'brand_id' => $brandIds[1] ?? null,
                    'stock' => 25,
                    'is_active' => true,
                    'is_featured' => true,
                ],
                [
                    'name' => 'Micro Thu Âm BM-800',
                    'sku' => 'mic-bm800',
                    'slug' => 'micro-thu-am-bm800',
                    'price' => 320000,
                    'cost_price' => 180000,
                    'promotion_price' => null,
                    'promotion_start' => null,
                    'promotion_end' => null,
                    'image_url' => "{$imgBase}/microphone.png",
                    'images' => json_encode(["{$imgBase}/microphone.png", "{$imgBase}/sound-card.png"]),
                    'description' => '<h2>Micro thu âm BM-800 chuyên nghiệp</h2><p>Micro condenser chất lượng cao, thu âm rõ ràng, giảm tiếng ồn hiệu quả. Phù hợp livestream, podcast, hát karaoke.</p>',
                    'category' => 'Thiết bị âm thanh',
                    'category_id' => $categoryIds[2] ?? null,
                    'brand_id' => $brandIds[2] ?? null,
                    'stock' => 50,
                    'is_active' => true,
                    'is_featured' => true,
                ],
                [
                    'name' => 'Giá đỡ điện thoại Tripod 3 chân',
                    'sku' => 'tripod-3chan',
                    'slug' => 'gia-do-dien-thoai-tripod',
                    'price' => 180000,
                    'cost_price' => 95000,
                    'promotion_price' => 149000,
                    'promotion_start' => now()->subDays(3),
                    'promotion_end' => now()->addDays(15),
                    'image_url' => "{$imgBase}/tripod.png",
                    'images' => json_encode(["{$imgBase}/tripod.png", "{$imgBase}/ring-light.png"]),
                    'description' => '<h2>Giá đỡ điện thoại Tripod 3 chân</h2><p>Tripod nhôm cao cấp, chắc chắn, có thể điều chỉnh độ cao từ 50cm đến 170cm. Tặng kèm kẹp điện thoại đa năng.</p>',
                    'category' => 'Phụ kiện điện thoại',
                    'category_id' => $categoryIds[1] ?? null,
                    'brand_id' => $brandIds[3] ?? null,
                    'stock' => 100,
                    'is_active' => true,
                    'is_featured' => false,
                ],
                [
                    'name' => 'Đèn LED Panel 600',
                    'sku' => 'led-panel-600',
                    'slug' => 'den-led-panel-600',
                    'price' => 890000,
                    'cost_price' => 550000,
                    'promotion_price' => 750000,
                    'promotion_start' => now()->subDays(2),
                    'promotion_end' => now()->addDays(20),
                    'image_url' => "{$imgBase}/led-panel.png",
                    'images' => json_encode(["{$imgBase}/led-panel.png", "{$imgBase}/softbox.png", "{$imgBase}/ring-light.png"]),
                    'description' => '<h2>Đèn LED Panel 600 chuyên nghiệp</h2><p>Đèn LED panel 600 bóng, điều chỉnh nhiệt độ màu 3200K-5600K, điều khiển từ xa, hoàn hảo cho studio và livestream chuyên nghiệp.</p>',
                    'category' => 'Đèn Livestream',
                    'category_id' => $categoryIds[0] ?? null,
                    'brand_id' => $brandIds[1] ?? null,
                    'stock' => 15,
                    'is_active' => true,
                    'is_featured' => true,
                ],
                [
                    'name' => 'Phông nền xanh Green Screen 2x3m',
                    'sku' => 'green-screen-2x3',
                    'slug' => 'phong-nen-xanh-green-screen',
                    'price' => 250000,
                    'cost_price' => 120000,
                    'promotion_price' => null,
                    'promotion_start' => null,
                    'promotion_end' => null,
                    'image_url' => "{$imgBase}/green-screen.png",
                    'images' => json_encode(["{$imgBase}/green-screen.png"]),
                    'description' => '<h2>Phông nền Green Screen</h2><p>Phông nền xanh chuyên dụng cho chroma key, kích thước 2x3m, chất liệu cotton dày, không nhăn, dễ giặt.</p>',
                    'category' => 'Phông nền',
                    'category_id' => $categoryIds[3] ?? null,
                    'brand_id' => $brandIds[0] ?? null,
                    'stock' => 40,
                    'is_active' => true,
                    'is_featured' => false,
                ],
                [
                    'name' => 'Webcam HD 1080p AutoFocus',
                    'sku' => 'webcam-1080p',
                    'slug' => 'webcam-hd-1080p',
                    'price' => 650000,
                    'cost_price' => 400000,
                    'promotion_price' => 550000,
                    'promotion_start' => now()->subDays(1),
                    'promotion_end' => now()->addDays(10),
                    'image_url' => "{$imgBase}/webcam.png",
                    'images' => json_encode(["{$imgBase}/webcam.png", "{$imgBase}/tripod.png"]),
                    'description' => '<h2>Webcam HD 1080p AutoFocus</h2><p>Webcam chất lượng Full HD với autofocus nhanh, tích hợp micro kép giảm ồn, góc rộng 90°. Plug & play, tương thích mọi nền tảng.</p>',
                    'category' => 'Camera & Webcam',
                    'category_id' => $categoryIds[4] ?? null,
                    'brand_id' => $brandIds[3] ?? null,
                    'stock' => 30,
                    'is_active' => true,
                    'is_featured' => true,
                ],
                [
                    'name' => 'Sound Card V8 Plus',
                    'sku' => 'sound-card-v8',
                    'slug' => 'sound-card-v8-plus',
                    'price' => 280000,
                    'cost_price' => 140000,
                    'promotion_price' => null,
                    'promotion_start' => null,
                    'promotion_end' => null,
                    'image_url' => "{$imgBase}/sound-card.png",
                    'images' => json_encode(["{$imgBase}/sound-card.png", "{$imgBase}/microphone.png"]),
                    'description' => '<h2>Sound Card V8 Plus</h2><p>Sound card thu âm V8 Plus với 12 hiệu ứng âm thanh, hỗ trợ karaoke, livestream, podcast. Kết nối qua USB và 3.5mm.</p>',
                    'category' => 'Thiết bị âm thanh',
                    'category_id' => $categoryIds[2] ?? null,
                    'brand_id' => $brandIds[2] ?? null,
                    'stock' => 60,
                    'is_active' => true,
                    'is_featured' => false,
                ],
                [
                    'name' => 'Bộ đèn Softbox 50x70cm (2 cái)',
                    'sku' => 'softbox-50x70-set',
                    'slug' => 'bo-den-softbox-50x70',
                    'price' => 750000,
                    'cost_price' => 400000,
                    'promotion_price' => 620000,
                    'promotion_start' => now()->subDays(5),
                    'promotion_end' => now()->addDays(25),
                    'image_url' => "{$imgBase}/softbox.png",
                    'images' => json_encode(["{$imgBase}/softbox.png", "{$imgBase}/led-panel.png", "{$imgBase}/ring-light.png"]),
                    'description' => '<h2>Bộ đèn Softbox 50x70cm</h2><p>Bộ 2 đèn softbox chuyên nghiệp, ánh sáng mềm đều, kèm giá đỡ 2m. Lý tưởng cho studio chụp ảnh sản phẩm và livestream.</p>',
                    'category' => 'Đèn Livestream',
                    'category_id' => $categoryIds[0] ?? null,
                    'brand_id' => $brandIds[1] ?? null,
                    'stock' => 20,
                    'is_active' => true,
                    'is_featured' => true,
                ],
            ];
            foreach ($products as $p) {
                $p['created_at'] = $p['updated_at'] = now();
                $productIds[] = $db->table('products')->insertGetId($p);
            }
        }

        // ═══════════════════════════════
        // Banners
        // ═══════════════════════════════
        $bnrBase = '/storage/banners';
        $db->table('banners')->insert([
                [
                    'title' => 'Flash Sale Đèn Livestream',
                    'description' => 'Giảm đến 30% tất cả đèn livestream chuyên nghiệp. Số lượng có hạn!',
                    'image' => "{$bnrBase}/flash-sale.png",
                    'url' => '/products',
                    'type' => 'main',
                    'sort' => 1,
                    'status' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'title' => 'Bộ Setup Livestream Hoàn Chỉnh',
                    'description' => 'Mua combo đèn + mic + tripod tiết kiệm 40%. Bắt đầu livestream ngay hôm nay!',
                    'image' => "{$bnrBase}/combo-deal.png",
                    'url' => '/products',
                    'type' => 'main',
                    'sort' => 2,
                    'status' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'title' => 'Miễn phí vận chuyển đơn từ 300K',
                    'description' => 'Áp dụng toàn quốc cho mọi đơn hàng từ 300.000đ trở lên.',
                    'image' => "{$bnrBase}/free-shipping.png",
                    'url' => null,
                    'type' => 'main',
                    'sort' => 3,
                    'status' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ],
            ]);

        // ═══════════════════════════════
        // CMS Pages
        // ═══════════════════════════════
        {
            $db->table('cms_pages')->insert([
                [
                    'title' => 'Giới thiệu cửa hàng',
                    'alias' => 'gioi-thieu',
                    'image' => 'https://placehold.co/1200x400/7c3aed/ffffff?text=Gioi+Thieu',
                    'content' => '<h2>Chào mừng đến với CUCAI Store</h2><p>Chúng tôi chuyên cung cấp thiết bị livestream chất lượng cao với giá cả hợp lý. Với hơn 5 năm kinh nghiệm trong ngành, CUCAI Store cam kết mang đến cho bạn những sản phẩm tốt nhất.</p><h3>Tại sao chọn chúng tôi?</h3><ul><li>Sản phẩm chính hãng 100%</li><li>Bảo hành 12 tháng</li><li>Giao hàng nhanh toàn quốc</li><li>Hỗ trợ kỹ thuật 24/7</li></ul>',
                    'sort' => 1, 'status' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'title' => 'Chính sách đổi trả',
                    'alias' => 'chinh-sach-doi-tra',
                    'image' => null,
                    'content' => '<h2>Chính sách đổi trả hàng</h2><p>Chúng tôi chấp nhận đổi trả trong vòng 7 ngày kể từ ngày nhận hàng.</p><h3>Điều kiện đổi trả</h3><ul><li>Sản phẩm còn nguyên tem, nhãn mác</li><li>Chưa qua sử dụng</li><li>Có hóa Đơn Nhập Hàng</li></ul><h3>Quy trình đổi trả</h3><ol><li>Liên hệ hotline: 0123.456.789</li><li>Gửi sản phẩm về kho</li><li>Nhận hàng mới trong 2-3 ngày</li></ol>',
                    'sort' => 2, 'status' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'title' => 'Hướng dẫn mua hàng',
                    'alias' => 'huong-dan-mua-hang',
                    'image' => null,
                    'content' => '<h2>Hướng dẫn mua hàng online</h2><p>Mua hàng tại CUCAI Store rất đơn giản, chỉ cần 3 bước:</p><ol><li><strong>Chọn sản phẩm:</strong> Tìm kiếm và thêm sản phẩm vào giỏ hàng</li><li><strong>Điền thông tin:</strong> Nhập họ tên, số điện thoại và địa chỉ giao hàng</li><li><strong>Xác nhận đơn:</strong> Kiểm tra lại và xác nhận đặt hàng</li></ol><blockquote>Hotline hỗ trợ: 0123.456.789 (8h-22h hàng ngày)</blockquote>',
                    'sort' => 3, 'status' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ],
            ]);
        }

        // ═══════════════════════════════
        // Customers
        // ═══════════════════════════════
        $customerIds = [];
        $customers = [
            ['unique_id' => 'fb_user_001', 'nickname' => 'Nguyễn Văn An', 'platform' => 'facebook', 'total_comments' => 15, 'hot_count' => 3, 'last_label' => 'hot', 'phone' => '0901234567', 'email' => 'nguyenvanan@gmail.com', 'address' => '123 Nguyễn Trãi, Q.1, TP.HCM'],
            ['unique_id' => 'fb_user_002', 'nickname' => 'Trần Thị Mai', 'platform' => 'facebook', 'total_comments' => 8, 'hot_count' => 1, 'last_label' => 'warm', 'phone' => '0912345678', 'email' => 'trantmai@gmail.com', 'address' => '45 Lê Lợi, Q.3, TP.HCM'],
            ['unique_id' => 'tt_user_001', 'nickname' => 'Lê Hoàng Phúc', 'platform' => 'tiktok', 'total_comments' => 22, 'hot_count' => 5, 'last_label' => 'hot', 'phone' => '0923456789', 'email' => 'lhphuc@gmail.com', 'address' => '78 Trần Hưng Đạo, Q.5, TP.HCM'],
            ['unique_id' => 'fb_user_003', 'nickname' => 'Phạm Minh Tuấn', 'platform' => 'facebook', 'total_comments' => 5, 'hot_count' => 0, 'last_label' => 'cold', 'phone' => '0934567890', 'email' => 'phamtuan@gmail.com', 'address' => '12 Hai Bà Trưng, Hà Nội'],
            ['unique_id' => 'yt_user_001', 'nickname' => 'Đỗ Thanh Hà', 'platform' => 'youtube', 'total_comments' => 12, 'hot_count' => 2, 'last_label' => 'warm', 'phone' => '0945678901', 'email' => 'dothanhha@gmail.com', 'address' => '56 Phan Đình Phùng, Đà Nẵng'],
        ];
        foreach ($customers as $c) {
            $c['created_at'] = $c['updated_at'] = now();
            $customerIds[] = $db->table('customers')->insertGetId($c);
        }

        // ═══════════════════════════════
        // Leads
        // ═══════════════════════════════
        {
            $leads = [
                ['customer_id' => $customerIds[0] ?? null, 'unique_id' => 'fb_user_001', 'nickname' => 'Nguyễn Văn An', 'comment' => 'Đèn này có bao nhiêu chế độ sáng vậy shop?', 'label' => 'hot', 'status' => 'contacted', 'product_intent' => 'Đèn Ring Light 18 inch'],
                ['customer_id' => $customerIds[1] ?? null, 'unique_id' => 'fb_user_002', 'nickname' => 'Trần Thị Mai', 'comment' => 'Mic này có giảm tiếng ồn không shop?', 'label' => 'warm', 'status' => 'new', 'product_intent' => 'Micro Thu Âm BM-800'],
                ['customer_id' => $customerIds[2] ?? null, 'unique_id' => 'tt_user_001', 'nickname' => 'Lê Hoàng Phúc', 'comment' => 'Mua combo đèn + mic giá bao nhiêu?', 'label' => 'hot', 'status' => 'ordered', 'product_intent' => 'Combo livestream'],
                ['customer_id' => $customerIds[3] ?? null, 'unique_id' => 'fb_user_003', 'nickname' => 'Phạm Minh Tuấn', 'comment' => 'Có ship Hà Nội không?', 'label' => 'cold', 'status' => 'new', 'product_intent' => null],
                ['customer_id' => $customerIds[4] ?? null, 'unique_id' => 'yt_user_001', 'nickname' => 'Đỗ Thanh Hà', 'comment' => 'Webcam này có hỗ trợ OBS không shop?', 'label' => 'warm', 'status' => 'contacted', 'product_intent' => 'Webcam HD 1080p'],
                ['customer_id' => $customerIds[0] ?? null, 'unique_id' => 'fb_user_001', 'nickname' => 'Nguyễn Văn An', 'comment' => 'Cho mình đặt 2 cái đèn ring light nhé', 'label' => 'hot', 'status' => 'ordered', 'product_intent' => 'Đèn Ring Light 18 inch'],
                ['customer_id' => $customerIds[2] ?? null, 'unique_id' => 'tt_user_001', 'nickname' => 'Lê Hoàng Phúc', 'comment' => 'Tripod có chắc không, livestream 3-4 tiếng liên tục được không?', 'label' => 'hot', 'status' => 'new', 'product_intent' => 'Giá đỡ Tripod'],
                ['customer_id' => $customerIds[1] ?? null, 'unique_id' => 'fb_user_002', 'nickname' => 'Trần Thị Mai', 'comment' => 'Sound card V8 có kết nối bluetooth không?', 'label' => 'warm', 'status' => 'new', 'product_intent' => 'Sound Card V8 Plus'],
            ];
            foreach ($leads as $l) {
                $l['created_at'] = $l['updated_at'] = now();
                $db->table('leads')->insert($l);
            }
        }

        // ═══════════════════════════════
        // Orders
        // ═══════════════════════════════
        {
            $orders = [
                [
                    'customer_id' => $customerIds[0] ?? null,
                    'customer_name' => 'Nguyễn Văn An',
                    'customer_phone' => '0901234567',
                    'customer_address' => '123 Nguyễn Trãi, Q.1, TP.HCM',
                    'status' => 'confirmed',
                    'total_amount' => 1228000,
                    'payment_method' => 'cod',
                    'payment_status' => 'unpaid',
                    'items' => json_encode([
                        ['name' => 'Đèn Ring Light 18 inch', 'qty' => 2, 'price' => 389000],
                        ['name' => 'Giá đỡ Tripod 3 chân', 'qty' => 1, 'price' => 149000],
                        ['name' => 'Micro Thu Âm BM-800', 'qty' => 1, 'price' => 320000],
                    ]),
                    'notes' => 'Giao giờ hành chính',
                    'confirmed_at' => now()->subHours(2),
                ],
                [
                    'customer_id' => $customerIds[2] ?? null,
                    'customer_name' => 'Lê Hoàng Phúc',
                    'customer_phone' => '0923456789',
                    'customer_address' => '78 Trần Hưng Đạo, Q.5, TP.HCM',
                    'status' => 'shipped',
                    'total_amount' => 750000,
                    'payment_method' => 'bank_transfer',
                    'payment_status' => 'paid',
                    'items' => json_encode([
                        ['name' => 'Đèn LED Panel 600', 'qty' => 1, 'price' => 750000],
                    ]),
                    'notes' => null,
                    'confirmed_at' => now()->subDays(1),
                    'shipped_at' => now()->subHours(6),
                    'tracking_number' => 'VN123456789',
                ],
                [
                    'customer_id' => $customerIds[4] ?? null,
                    'customer_name' => 'Đỗ Thanh Hà',
                    'customer_phone' => '0945678901',
                    'customer_address' => '56 Phan Đình Phùng, Đà Nẵng',
                    'status' => 'pending',
                    'total_amount' => 830000,
                    'payment_method' => 'cod',
                    'payment_status' => 'unpaid',
                    'items' => json_encode([
                        ['name' => 'Webcam HD 1080p AutoFocus', 'qty' => 1, 'price' => 550000],
                        ['name' => 'Sound Card V8 Plus', 'qty' => 1, 'price' => 280000],
                    ]),
                    'notes' => 'Gọi trước khi giao',
                ],
                [
                    'customer_id' => $customerIds[1] ?? null,
                    'customer_name' => 'Trần Thị Mai',
                    'customer_phone' => '0912345678',
                    'customer_address' => '45 Lê Lợi, Q.3, TP.HCM',
                    'status' => 'delivered',
                    'total_amount' => 620000,
                    'payment_method' => 'cod',
                    'payment_status' => 'paid',
                    'items' => json_encode([
                        ['name' => 'Bộ đèn Softbox 50x70cm', 'qty' => 1, 'price' => 620000],
                    ]),
                    'notes' => null,
                    'confirmed_at' => now()->subDays(5),
                    'shipped_at' => now()->subDays(4),
                    'delivered_at' => now()->subDays(2),
                ],
            ];
            foreach ($orders as $o) {
                $o['created_at'] = $o['updated_at'] = now();
                $orderId = $db->table('orders')->insertGetId($o);

                // Insert order_details
                $items = json_decode($o['items'], true);
                foreach ($items as $item) {
                    $db->table('order_details')->insert([
                        'order_id' => $orderId,
                        'name' => $item['name'],
                        'price' => $item['price'],
                        'qty' => $item['qty'],
                        'total_price' => $item['price'] * $item['qty'],
                        'created_at' => now(),
                    ]);
                }
            }
        }

        // ═══════════════════════════════
        // Nav Links
        // ═══════════════════════════════
        if ($db->table('nav_links')->count() < 1) {
            $db->table('nav_links')->insert([
                ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Sản phẩm', 'url' => '/products', 'icon' => 'Package', 'sort' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Giới thiệu', 'url' => '/page/gioi-thieu', 'icon' => 'Info', 'sort' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Chính sách', 'url' => '/page/chinh-sach-doi-tra', 'icon' => 'Shield', 'sort' => 4, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Hướng dẫn', 'url' => '/page/huong-dan-mua-hang', 'icon' => 'HelpCircle', 'sort' => 5, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // ═══════════════════════════════
        // System Configs
        // ═══════════════════════════════
        $configs = [
            ['key' => 'store_name', 'value' => 'CUCAI Store', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'store_phone', 'value' => '0123.456.789', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'store_email', 'value' => 'contact@cucai.store', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'store_address', 'value' => '123 Nguyễn Huệ, Q.1, TP.HCM', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'store_description', 'value' => 'Thiết bị Livestream chuyên nghiệp', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'currency', 'value' => 'VND', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'free_shipping_min', 'value' => '300000', 'type' => 'number', 'group_name' => 'store'],
        ];
        foreach ($configs as $cfg) {
            $existing = $db->table('system_configs')->where('key', $cfg['key'])->first();
            if (!$existing) {
                $cfg['created_at'] = $cfg['updated_at'] = now();
                $db->table('system_configs')->insert($cfg);
            }
        }

        // ═══════════════════════════════
        // Notifications (for first user)
        // ═══════════════════════════════
        $userId = $db->table('users')->first()?->id;
        if ($userId && $db->table('notifications')->count() < 3) {
            $db->table('notifications')->insert([
                ['user_id' => $userId, 'type' => 'order', 'title' => 'Đơn hàng mới', 'message' => 'Nguyễn Văn An vừa đặt đơn hàng #1001 trị giá 1.228.000đ', 'link' => '/orders', 'is_read' => false, 'created_at' => now()->subMinutes(30)],
                ['user_id' => $userId, 'type' => 'lead', 'title' => 'Lead mới từ Facebook', 'message' => 'Lê Hoàng Phúc quan tâm sản phẩm "Đèn Ring Light 18 inch"', 'link' => '/crm', 'is_read' => false, 'created_at' => now()->subHours(1)],
                ['user_id' => $userId, 'type' => 'system', 'title' => 'Sản phẩm sắp hết hàng', 'message' => 'Đèn LED Panel 600 chỉ còn 15 sản phẩm trong kho', 'link' => '/shop/products', 'is_read' => true, 'created_at' => now()->subHours(3)],
                ['user_id' => $userId, 'type' => 'order', 'title' => 'Đơn hàng đã giao', 'message' => 'Đơn hàng #998 đã được giao thành công cho Trần Thị Mai', 'link' => '/orders', 'is_read' => true, 'created_at' => now()->subDays(1)],
                ['user_id' => $userId, 'type' => 'lead', 'title' => '3 leads mới hôm nay', 'message' => 'Bạn có 3 khách hàng tiềm năng mới từ buổi livestream sáng nay', 'link' => '/crm', 'is_read' => false, 'created_at' => now()->subHours(5)],
            ]);
        }

        // ═══════════════════════════════
        // Flash Sales
        // ═══════════════════════════════
        if ($db->table('flash_sales')->count() < 1) {
            $flashSaleId = $db->table('flash_sales')->insertGetId([
                'name' => 'Flash Sale Tháng 3',
                'start_date' => now()->subDays(1),
                'end_date' => now()->addDays(7),
                'is_active' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);

            // Add products to flash sale
            if (count($productIds) >= 3) {
                // Get product prices for flash sale
                $flashProducts = $db->table('products')->whereIn('id', [$productIds[0], $productIds[3], $productIds[5]])->get();
                $items = [];
                foreach ($flashProducts as $fp) {
                    $items[] = [
                        'flash_sale_id' => $flashSaleId,
                        'product_id' => $fp->id,
                        'original_price' => $fp->price,
                        'sale_price' => round($fp->price * 0.7, 2), // 30% off
                        'stock_limit' => 10,
                        'sold_count' => 0,
                        'created_at' => now(),
                    ];
                }
                $db->table('flash_sale_items')->insert($items);
            }
        }

        // ═══════════════════════════════
        // Product Variants (comprehensive — multiple products)
        // ═══════════════════════════════
        if (count($productIds) > 0) {
            $variants = [
                // Ring Light variants (size + color)
                ['product_id' => $productIds[0], 'name' => '18 inch - Trắng', 'sku' => 'ring-light-18-white', 'price' => 450000, 'stock' => 10, 'is_active' => true],
                ['product_id' => $productIds[0], 'name' => '18 inch - Đen', 'sku' => 'ring-light-18-black', 'price' => 480000, 'stock' => 15, 'is_active' => true],
                ['product_id' => $productIds[0], 'name' => '14 inch - Trắng', 'sku' => 'ring-light-14-white', 'price' => 350000, 'stock' => 20, 'is_active' => true],
                ['product_id' => $productIds[0], 'name' => '14 inch - Đen', 'sku' => 'ring-light-14-black', 'price' => 370000, 'stock' => 18, 'is_active' => true],
                // Micro BM-800 variants (color)
                ['product_id' => $productIds[1], 'name' => 'Vàng Gold', 'sku' => 'mic-bm800-gold', 'price' => 320000, 'stock' => 25, 'is_active' => true],
                ['product_id' => $productIds[1], 'name' => 'Đen Bạc', 'sku' => 'mic-bm800-silver', 'price' => 320000, 'stock' => 30, 'is_active' => true],
                ['product_id' => $productIds[1], 'name' => 'Hồng Rose Gold', 'sku' => 'mic-bm800-rose', 'price' => 350000, 'stock' => 12, 'is_active' => true],
                // Tripod variants (height)
                ['product_id' => $productIds[2], 'name' => 'Cao 1.2m', 'sku' => 'tripod-120cm', 'price' => 150000, 'stock' => 40, 'is_active' => true],
                ['product_id' => $productIds[2], 'name' => 'Cao 1.7m', 'sku' => 'tripod-170cm', 'price' => 180000, 'stock' => 35, 'is_active' => true],
                ['product_id' => $productIds[2], 'name' => 'Cao 2.1m Pro', 'sku' => 'tripod-210cm', 'price' => 250000, 'stock' => 20, 'is_active' => true],
                // LED Panel variants (wattage)
                ['product_id' => $productIds[3], 'name' => '300 LED - 15W', 'sku' => 'led-panel-300', 'price' => 550000, 'stock' => 10, 'is_active' => true],
                ['product_id' => $productIds[3], 'name' => '600 LED - 36W', 'sku' => 'led-panel-600w', 'price' => 890000, 'stock' => 8, 'is_active' => true],
                ['product_id' => $productIds[3], 'name' => '900 LED - 54W Pro', 'sku' => 'led-panel-900', 'price' => 1290000, 'stock' => 5, 'is_active' => true],
                // Green Screen variants (size)
                ['product_id' => $productIds[4], 'name' => '1.5x2m', 'sku' => 'green-15x2', 'price' => 180000, 'stock' => 25, 'is_active' => true],
                ['product_id' => $productIds[4], 'name' => '2x3m', 'sku' => 'green-2x3m', 'price' => 250000, 'stock' => 20, 'is_active' => true],
                ['product_id' => $productIds[4], 'name' => '3x6m Studio', 'sku' => 'green-3x6m', 'price' => 450000, 'stock' => 10, 'is_active' => true],
                // Webcam variants (resolution)
                ['product_id' => $productIds[5], 'name' => '720p Basic', 'sku' => 'webcam-720p', 'price' => 350000, 'stock' => 20, 'is_active' => true],
                ['product_id' => $productIds[5], 'name' => '1080p HD', 'sku' => 'webcam-1080p-v', 'price' => 650000, 'stock' => 15, 'is_active' => true],
                ['product_id' => $productIds[5], 'name' => '2K QHD Pro', 'sku' => 'webcam-2k', 'price' => 950000, 'stock' => 8, 'is_active' => true],
                // Sound Card variants
                ['product_id' => $productIds[6], 'name' => 'V8 Basic', 'sku' => 'sc-v8-basic', 'price' => 180000, 'stock' => 30, 'is_active' => true],
                ['product_id' => $productIds[6], 'name' => 'V8 Plus', 'sku' => 'sc-v8-plus', 'price' => 280000, 'stock' => 25, 'is_active' => true],
                ['product_id' => $productIds[6], 'name' => 'V8 Pro Bluetooth', 'sku' => 'sc-v8-pro-bt', 'price' => 420000, 'stock' => 15, 'is_active' => true],
                // Softbox variants
                ['product_id' => $productIds[7], 'name' => '50x70cm (1 cái)', 'sku' => 'softbox-50x70-1', 'price' => 420000, 'stock' => 15, 'is_active' => true],
                ['product_id' => $productIds[7], 'name' => '50x70cm (2 cái)', 'sku' => 'softbox-50x70-2', 'price' => 750000, 'stock' => 10, 'is_active' => true],
                ['product_id' => $productIds[7], 'name' => '60x90cm Pro (2 cái)', 'sku' => 'softbox-60x90-2', 'price' => 1100000, 'stock' => 5, 'is_active' => true],
            ];
            foreach ($variants as $v) {
                $v['created_at'] = $v['updated_at'] = now();
                $db->table('product_variants')->insert($v);
            }
        }

        echo "\n✅ Tenant seeder completed successfully!\n";
        echo "   📦 Categories: " . $db->table('product_categories')->count() . "\n";
        echo "   🏷️  Brands: " . $db->table('product_brands')->count() . "\n";
        echo "   🛍️  Products: " . $db->table('products')->count() . "\n";
        echo "   🖼️  Banners: " . $db->table('banners')->count() . "\n";
        echo "   📄 CMS Pages: " . $db->table('cms_pages')->count() . "\n";
        echo "   👥 Customers: " . $db->table('customers')->count() . "\n";
        echo "   🎯 Leads: " . $db->table('leads')->count() . "\n";
        echo "   📋 Orders: " . $db->table('orders')->count() . "\n";
        echo "   🔔 Notifications: " . $db->table('notifications')->count() . "\n";
        echo "   🔗 Nav Links: " . $db->table('nav_links')->count() . "\n";
        echo "   ⚡ Flash Sales: " . $db->table('flash_sales')->count() . "\n";
    }
}
