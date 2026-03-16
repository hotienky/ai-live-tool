<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;

/**
 * ClothingTenantSeeder — Seeds fashion/clothing data for a tenant database.
 *
 * Usage:
 *   TENANT_DB=tenant_fashionvn docker compose exec backend-laravel php artisan db:seed --class=ClothingTenantSeeder
 */
class ClothingTenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_fashionvn');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        echo "🔌 Connected to tenant DB: {$tenantDb}\n";

        $db = DB::connection('pgsql');

        // Reset seeded data
        echo "🗑️  Clearing old data...\n";
        $tables = ['flash_sale_items','flash_sales','product_variants','order_details','orders','leads','notifications','nav_links','banners','cms_pages','customers','products','product_brands','product_categories'];
        foreach ($tables as $t) {
            try { $db->table($t)->delete(); } catch (\Exception $e) {}
        }

        // ═══════════════════════════════
        // Categories
        // ═══════════════════════════════
        echo "📂 Seeding categories...\n";
        $categoryIds = [];
        $cats = [
            ['name' => 'Áo Nam', 'slug' => 'ao-nam', 'description' => 'Áo thun, polo, sơ mi, hoodie, áo khoác nam', 'sort_order' => 1, 'is_active' => true],
            ['name' => 'Áo Nữ', 'slug' => 'ao-nu', 'description' => 'Áo sơ mi, blouse, áo thun, áo kiểu nữ', 'sort_order' => 2, 'is_active' => true],
            ['name' => 'Quần Nam', 'slug' => 'quan-nam', 'description' => 'Quần jean, quần short, quần kaki nam', 'sort_order' => 3, 'is_active' => true],
            ['name' => 'Váy & Đầm', 'slug' => 'vay-dam', 'description' => 'Váy midi, đầm dự tiệc, chân váy công sở', 'sort_order' => 4, 'is_active' => true],
            ['name' => 'Phụ kiện', 'slug' => 'phu-kien', 'description' => 'Túi xách, giày dép, thắt lưng, phụ kiện thời trang', 'sort_order' => 5, 'is_active' => true],
        ];
        foreach ($cats as $c) {
            $c['created_at'] = $c['updated_at'] = now();
            $categoryIds[$c['slug']] = $db->table('product_categories')->insertGetId($c);
        }

        // ═══════════════════════════════
        // Brands
        // ═══════════════════════════════
        echo "🏷️  Seeding brands...\n";
        $brandIds = [];
        $brands = [
            ['name' => 'Fashion VN', 'slug' => 'fashion-vn', 'description' => 'Thương hiệu thời trang Việt Nam', 'is_active' => true],
            ['name' => 'Urban Style', 'slug' => 'urban-style', 'description' => 'Phong cách đô thị hiện đại', 'is_active' => true],
            ['name' => 'Elegant Lady', 'slug' => 'elegant-lady', 'description' => 'Thời trang nữ thanh lịch', 'is_active' => true],
            ['name' => 'DenimCo', 'slug' => 'denimco', 'description' => 'Chuyên denim và casual wear', 'is_active' => true],
        ];
        foreach ($brands as $b) {
            $b['created_at'] = $b['updated_at'] = now();
            $brandIds[$b['slug']] = $db->table('product_brands')->insertGetId($b);
        }

        // ═══════════════════════════════
        // Products (10 items)
        // ═══════════════════════════════
        echo "👕 Seeding products...\n";
        $imgBase = '/storage/clothing/products';
        $productIds = [];

        $products = [
            [
                'name' => 'Áo Thun Cotton Basic',
                'sku' => 'ao-thun-basic-001',
                'slug' => 'ao-thun-cotton-basic',
                'price' => 199000,
                'cost_price' => 95000,
                'promotion_price' => 159000,
                'promotion_start' => now()->subDays(1),
                'promotion_end' => now()->addDays(30),
                'image_url' => "{$imgBase}/ao-thun-nam.png",
                'images' => json_encode(["{$imgBase}/ao-thun-nam.png", "{$imgBase}/ao-polo.png"]),
                'description' => '<h2>Áo Thun Cotton Basic Nam</h2><p>Áo thun nam chất liệu cotton 100% mềm mại, thoáng khí. Form regular fit thoải mái.</p><ul><li>Chất liệu: Cotton 100%</li><li>Form: Regular fit</li><li>Cổ tròn</li></ul>',
                'category_slug' => 'ao-nam',
                'brand_slug' => 'fashion-vn',
                'stock' => 500,
                'weight' => 200,
            ],
            [
                'name' => 'Áo Polo Classic',
                'sku' => 'ao-polo-classic-002',
                'slug' => 'ao-polo-classic',
                'price' => 349000,
                'cost_price' => 160000,
                'promotion_price' => 289000,
                'promotion_start' => now()->subDays(3),
                'promotion_end' => now()->addDays(15),
                'image_url' => "{$imgBase}/ao-polo.png",
                'images' => json_encode(["{$imgBase}/ao-polo.png", "{$imgBase}/ao-thun-nam.png"]),
                'description' => '<h2>Áo Polo Classic Nam</h2><p>Áo polo nam form slim fit, cotton pha polyester co giãn nhẹ.</p><ul><li>Chất liệu: Cotton 65% / Poly 35%</li><li>Form: Slim fit</li><li>Cổ bẻ, 3 nút</li></ul>',
                'category_slug' => 'ao-nam',
                'brand_slug' => 'urban-style',
                'stock' => 300,
                'weight' => 250,
            ],
            [
                'name' => 'Áo Hoodie Oversize',
                'sku' => 'ao-hoodie-os-003',
                'slug' => 'ao-hoodie-oversize',
                'price' => 450000,
                'cost_price' => 210000,
                'promotion_price' => null,
                'promotion_start' => null,
                'promotion_end' => null,
                'image_url' => "{$imgBase}/ao-hoodie.png",
                'images' => json_encode(["{$imgBase}/ao-hoodie.png", "{$imgBase}/ao-khoac.png"]),
                'description' => '<h2>Áo Hoodie Oversize Unisex</h2><p>Hoodie oversize chất nỉ bông dày dặn. Túi kangaroo, mũ trùm đầu.</p><ul><li>Nỉ bông 350gsm</li><li>Form Oversize</li><li>Unisex</li></ul>',
                'category_slug' => 'ao-nam',
                'brand_slug' => 'urban-style',
                'stock' => 200,
                'weight' => 450,
            ],
            [
                'name' => 'Áo Khoác Bomber',
                'sku' => 'ao-khoac-bomber-004',
                'slug' => 'ao-khoac-bomber',
                'price' => 650000,
                'cost_price' => 320000,
                'promotion_price' => 549000,
                'promotion_start' => now(),
                'promotion_end' => now()->addDays(20),
                'image_url' => "{$imgBase}/ao-khoac.png",
                'images' => json_encode(["{$imgBase}/ao-khoac.png", "{$imgBase}/ao-hoodie.png"]),
                'description' => '<h2>Áo Khoác Bomber Nam</h2><p>Bomber vải dù chống gió nhẹ, lớp lót mỏng. Phong cách casual.</p><ul><li>Vải dù chống gió</li><li>Khóa kéo YKK</li><li>2 túi bên</li></ul>',
                'category_slug' => 'ao-nam',
                'brand_slug' => 'fashion-vn',
                'stock' => 150,
                'weight' => 500,
            ],
            [
                'name' => 'Áo Sơ Mi Nữ Thanh Lịch',
                'sku' => 'ao-somi-nu-005',
                'slug' => 'ao-so-mi-nu-thanh-lich',
                'price' => 389000,
                'cost_price' => 175000,
                'promotion_price' => 329000,
                'promotion_start' => now()->subDays(2),
                'promotion_end' => now()->addDays(25),
                'image_url' => "{$imgBase}/ao-so-mi-nu.png",
                'images' => json_encode(["{$imgBase}/ao-so-mi-nu.png", "{$imgBase}/chan-vay.png"]),
                'description' => '<h2>Áo Sơ Mi Nữ Thanh Lịch</h2><p>Cotton lụa mềm mại, phù hợp đi làm và dự tiệc.</p><ul><li>Cotton lụa</li><li>Cổ đức thanh lịch</li></ul>',
                'category_slug' => 'ao-nu',
                'brand_slug' => 'elegant-lady',
                'stock' => 250,
                'weight' => 180,
            ],
            [
                'name' => 'Quần Jean Slim Fit',
                'sku' => 'quan-jean-slim-006',
                'slug' => 'quan-jean-slim-fit',
                'price' => 550000,
                'cost_price' => 250000,
                'promotion_price' => 459000,
                'promotion_start' => now()->subDays(5),
                'promotion_end' => now()->addDays(10),
                'image_url' => "{$imgBase}/quan-jean.png",
                'images' => json_encode(["{$imgBase}/quan-jean.png", "{$imgBase}/quan-short.png"]),
                'description' => '<h2>Quần Jean Slim Fit Nam</h2><p>Denim co giãn thoải mái. Wash nhẹ phong cách.</p><ul><li>Denim co giãn</li><li>95% Cotton, 5% Spandex</li></ul>',
                'category_slug' => 'quan-nam',
                'brand_slug' => 'denimco',
                'stock' => 400,
                'weight' => 600,
            ],
            [
                'name' => 'Quần Short Kaki',
                'sku' => 'quan-short-kaki-007',
                'slug' => 'quan-short-kaki',
                'price' => 299000,
                'cost_price' => 130000,
                'promotion_price' => null,
                'promotion_start' => null,
                'promotion_end' => null,
                'image_url' => "{$imgBase}/quan-short.png",
                'images' => json_encode(["{$imgBase}/quan-short.png", "{$imgBase}/quan-jean.png"]),
                'description' => '<h2>Quần Short Kaki Nam</h2><p>Cotton kaki thoáng mát, phù hợp mùa hè.</p><ul><li>Cotton kaki</li><li>2 túi bên, 1 túi sau</li></ul>',
                'category_slug' => 'quan-nam',
                'brand_slug' => 'fashion-vn',
                'stock' => 350,
                'weight' => 350,
            ],
            [
                'name' => 'Váy Đầm Hoa Nhí Midi',
                'sku' => 'vay-dam-hoa-008',
                'slug' => 'vay-dam-hoa-nhi-midi',
                'price' => 520000,
                'cost_price' => 240000,
                'promotion_price' => 449000,
                'promotion_start' => now(),
                'promotion_end' => now()->addDays(30),
                'image_url' => "{$imgBase}/vay-dam.png",
                'images' => json_encode(["{$imgBase}/vay-dam.png", "{$imgBase}/chan-vay.png", "{$imgBase}/ao-so-mi-nu.png"]),
                'description' => '<h2>Váy Đầm Hoa Nhí Midi</h2><p>Vintage lãng mạn, voan nhẹ mềm mại. Dáng xòe nhẹ, thắt eo tinh tế.</p>',
                'category_slug' => 'vay-dam',
                'brand_slug' => 'elegant-lady',
                'stock' => 180,
                'weight' => 300,
            ],
            [
                'name' => 'Chân Váy Xếp Ly',
                'sku' => 'chan-vay-xeply-009',
                'slug' => 'chan-vay-xep-ly',
                'price' => 380000,
                'cost_price' => 170000,
                'promotion_price' => 319000,
                'promotion_start' => now()->subDays(1),
                'promotion_end' => now()->addDays(14),
                'image_url' => "{$imgBase}/chan-vay.png",
                'images' => json_encode(["{$imgBase}/chan-vay.png", "{$imgBase}/vay-dam.png"]),
                'description' => '<h2>Chân Váy Xếp Ly Midi</h2><p>A-line thanh lịch, taffeta giữ form tốt. Lưng thun thoải mái.</p>',
                'category_slug' => 'vay-dam',
                'brand_slug' => 'elegant-lady',
                'stock' => 220,
                'weight' => 280,
            ],
            [
                'name' => 'Túi Tote Da Nữ',
                'sku' => 'tui-tote-da-010',
                'slug' => 'tui-tote-da-nu',
                'price' => 680000,
                'cost_price' => 300000,
                'promotion_price' => 580000,
                'promotion_start' => now(),
                'promotion_end' => now()->addDays(7),
                'image_url' => "{$imgBase}/tui-xach.png",
                'images' => json_encode(["{$imgBase}/tui-xach.png"]),
                'description' => '<h2>Túi Tote Da Nữ Cao Cấp</h2><p>Da PU cao cấp, chứa laptop 13". Thiết kế tối giản.</p><ul><li>35x28x12cm</li><li>2 quai xách + dây đeo</li></ul>',
                'category_slug' => 'phu-kien',
                'brand_slug' => 'fashion-vn',
                'stock' => 120,
                'weight' => 600,
            ],
        ];

        foreach ($products as $p) {
            $catSlug = $p['category_slug'];
            $brandSlug = $p['brand_slug'];
            unset($p['category_slug'], $p['brand_slug']);

            $p['category_id'] = $categoryIds[$catSlug] ?? null;
            $p['brand_id'] = $brandIds[$brandSlug] ?? null;
            $p['is_active'] = true;
            $p['is_featured'] = in_array($p['sku'], ['ao-thun-basic-001', 'vay-dam-hoa-008', 'quan-jean-slim-006', 'ao-khoac-bomber-004']);
            $p['created_at'] = $p['updated_at'] = now();

            $productIds[$p['sku']] = $db->table('products')->insertGetId($p);
        }

        // ═══════════════════════════════
        // Product Variants (attributes jsonb for size/color)
        // ═══════════════════════════════
        echo "🎨 Seeding variants...\n";
        $variantData = [
            // Áo Thun Basic — 4 sizes × 3 colors
            ['sku' => 'ao-thun-basic-001', 'variants' => [
                ['S', 'Xanh Navy', 0, 50], ['M', 'Xanh Navy', 0, 80], ['L', 'Xanh Navy', 0, 70], ['XL', 'Xanh Navy', 10000, 40],
                ['S', 'Trắng', 0, 60], ['M', 'Trắng', 0, 90], ['L', 'Trắng', 0, 75], ['XL', 'Trắng', 10000, 35],
                ['S', 'Đen', 0, 55], ['M', 'Đen', 0, 85], ['L', 'Đen', 0, 65], ['XL', 'Đen', 10000, 30],
            ]],
            // Polo Classic — 3 sizes × 3 colors
            ['sku' => 'ao-polo-classic-002', 'variants' => [
                ['M', 'Đỏ Rượu', 0, 40], ['L', 'Đỏ Rượu', 0, 50], ['XL', 'Đỏ Rượu', 10000, 30],
                ['M', 'Xanh Dương', 0, 45], ['L', 'Xanh Dương', 0, 55], ['XL', 'Xanh Dương', 10000, 25],
                ['M', 'Đen', 0, 50], ['L', 'Đen', 0, 60], ['XL', 'Đen', 10000, 35],
            ]],
            // Hoodie — 3 sizes × 2 colors
            ['sku' => 'ao-hoodie-os-003', 'variants' => [
                ['M', 'Xám', 0, 35], ['L', 'Xám', 0, 50], ['XL', 'Xám', 15000, 30],
                ['M', 'Đen', 0, 40], ['L', 'Đen', 0, 45], ['XL', 'Đen', 15000, 25],
            ]],
            // Bomber — 3 sizes × 2 colors
            ['sku' => 'ao-khoac-bomber-004', 'variants' => [
                ['M', 'Đen', 0, 25], ['L', 'Đen', 0, 40], ['XL', 'Đen', 20000, 20],
                ['M', 'Xanh Rêu', 0, 20], ['L', 'Xanh Rêu', 0, 35], ['XL', 'Xanh Rêu', 20000, 15],
            ]],
            // Sơ mi nữ — 3 sizes × 2 colors
            ['sku' => 'ao-somi-nu-005', 'variants' => [
                ['S', 'Trắng', 0, 45], ['M', 'Trắng', 0, 60], ['L', 'Trắng', 0, 40],
                ['S', 'Hồng Nhạt', 0, 35], ['M', 'Hồng Nhạt', 0, 50], ['L', 'Hồng Nhạt', 0, 30],
            ]],
            // Jean Slim — 5 waist sizes × 2 colors
            ['sku' => 'quan-jean-slim-006', 'variants' => [
                ['29', 'Xanh Đậm', 0, 40], ['30', 'Xanh Đậm', 0, 60], ['31', 'Xanh Đậm', 0, 70], ['32', 'Xanh Đậm', 0, 55], ['34', 'Xanh Đậm', 15000, 30],
                ['29', 'Xanh Nhạt', 0, 35], ['30', 'Xanh Nhạt', 0, 50], ['31', 'Xanh Nhạt', 0, 60], ['32', 'Xanh Nhạt', 0, 45], ['34', 'Xanh Nhạt', 15000, 25],
            ]],
            // Short Kaki — 3 sizes × 3 colors
            ['sku' => 'quan-short-kaki-007', 'variants' => [
                ['M', 'Xanh Olive', 0, 45], ['L', 'Xanh Olive', 0, 60], ['XL', 'Xanh Olive', 10000, 35],
                ['M', 'Be', 0, 50], ['L', 'Be', 0, 55], ['XL', 'Be', 10000, 30],
                ['M', 'Đen', 0, 40], ['L', 'Đen', 0, 50], ['XL', 'Đen', 10000, 25],
            ]],
            // Váy Đầm — 3 sizes × 2 colors
            ['sku' => 'vay-dam-hoa-008', 'variants' => [
                ['S', 'Hồng Hoa', 0, 30], ['M', 'Hồng Hoa', 0, 50], ['L', 'Hồng Hoa', 0, 35],
                ['S', 'Xanh Hoa', 0, 25], ['M', 'Xanh Hoa', 0, 40], ['L', 'Xanh Hoa', 0, 25],
            ]],
            // Chân Váy — 3 sizes × 2 colors
            ['sku' => 'chan-vay-xeply-009', 'variants' => [
                ['S', 'Be', 0, 35], ['M', 'Be', 0, 55], ['L', 'Be', 0, 40],
                ['S', 'Đen', 0, 30], ['M', 'Đen', 0, 50], ['L', 'Đen', 0, 35],
            ]],
            // Túi Tote — Free size × 3 colors
            ['sku' => 'tui-tote-da-010', 'variants' => [
                ['Free size', 'Nâu Bò', 0, 40],
                ['Free size', 'Đen', 0, 50],
                ['Free size', 'Kem', 30000, 30],
            ]],
        ];

        $totalVariants = 0;
        foreach ($variantData as $vd) {
            $productId = $productIds[$vd['sku']] ?? null;
            if (!$productId) continue;

            // Get product base price
            $basePrice = $db->table('products')->where('id', $productId)->value('price');

            foreach ($vd['variants'] as [$size, $color, $priceAdj, $stock]) {
                $db->table('product_variants')->insert([
                    'product_id' => $productId,
                    'name' => "{$size} / {$color}",
                    'sku' => $vd['sku'] . '-' . strtolower(str_replace(' ', '-', $size)) . '-' . strtolower(str_replace(' ', '-', $color)),
                    'price' => $basePrice + $priceAdj,
                    'stock' => $stock,
                    'attributes' => json_encode(['size' => $size, 'color' => $color]),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $totalVariants++;
            }
        }

        // ═══════════════════════════════
        // Admin user (CMS login)
        // ═══════════════════════════════
        echo "👤 Seeding admin user (CMS login)...\n";
        $db->table('users')->updateOrInsert(
            ['email' => 'admin@fashionvn.com'],
            [
                'name' => 'Fashion VN Admin',
                'email' => 'admin@fashionvn.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        echo "   📧 Email: admin@fashionvn.com\n";
        echo "   🔑 Password: password\n";

        // ═══════════════════════════════
        // Banners
        // ═══════════════════════════════
        echo "🖼️  Seeding banners...\n";
        $bannerBase = '/storage/clothing/banners';
        $banners = [
            ['title' => 'SALE ĐẾN 50% - Thời Trang Hè', 'description' => 'Giảm giá sốc toàn bộ sản phẩm mùa hè!', 'image' => "{$bannerBase}/sale.png", 'url' => '/products?category=ao-nam', 'type' => 'main', 'sort' => 1, 'status' => 1],
            ['title' => 'BST Mới - Thu Đông 2026', 'description' => 'Khám phá bộ sưu tập mới từ Elegant Lady', 'image' => "{$bannerBase}/new-collection.png", 'url' => '/products?category=vay-dam', 'type' => 'main', 'sort' => 2, 'status' => 1],
            ['title' => 'Summer Collection', 'description' => 'Outfit mùa hè tươi sáng, năng động', 'image' => "{$bannerBase}/summer.png", 'url' => '/products', 'type' => 'main', 'sort' => 3, 'status' => 1],
        ];
        foreach ($banners as $b) {
            $b['created_at'] = $b['updated_at'] = now();
            $db->table('banners')->insert($b);
        }

        // ═══════════════════════════════
        // CMS Pages (Rich Content)
        // ═══════════════════════════════
        echo "📝 Seeding CMS pages...\n";
        $pages = [
            [
                'title' => 'Về chúng tôi',
                'alias' => 'about',
                'image' => '/storage/clothing/banners/new-collection.png',
                'content' => <<<'HTML'
<div class="cms-about">
  <h1>Fashion VN — Thời Trang Việt Nam</h1>
  <p class="lead">Được thành lập năm 2020, Fashion VN là thương hiệu thời trang uy tín hàng đầu Việt Nam, mang đến phong cách hiện đại, chất lượng quốc tế với mức giá hợp lý nhất.</p>

  <h2>Tầm nhìn & Sứ mệnh</h2>
  <p>Chúng tôi tin rằng thời trang không chỉ là quần áo — đó là cách bạn thể hiện bản thân. Sứ mệnh của Fashion VN là giúp mỗi người Việt Nam tự tin với phong cách riêng, bất kể ngân sách.</p>

  <h2>Cam kết của chúng tôi</h2>
  <ul>
    <li><strong>Chất lượng đảm bảo:</strong> Mỗi sản phẩm đều trải qua quy trình kiểm soát chất lượng nghiêm ngặt 3 bước</li>
    <li><strong>Giá cả minh bạch:</strong> Không giá ảo, không khuyến mãi ảo — giá bạn thấy là giá thực</li>
    <li><strong>Giao hàng nhanh:</strong> Giao hàng toàn quốc 2-5 ngày. Miễn phí với đơn từ 500.000đ</li>
    <li><strong>Đổi trả dễ dàng:</strong> 30 ngày đổi trả miễn phí, không cần lý do</li>
    <li><strong>Bền vững:</strong> Cam kết sử dụng chất liệu thân thiện môi trường</li>
  </ul>

  <h2>Con số ấn tượng</h2>
  <table>
    <tr><td><strong>50.000+</strong></td><td>Khách hàng tin tưởng</td></tr>
    <tr><td><strong>4.8/5</strong></td><td>Đánh giá trung bình</td></tr>
    <tr><td><strong>200+</strong></td><td>Mẫu thiết kế mới mỗi tháng</td></tr>
    <tr><td><strong>63</strong></td><td>Tỉnh thành giao hàng</td></tr>
  </table>

  <h2>Liên hệ hợp tác</h2>
  <p>Email: <a href="mailto:partner@fashionvn.com">partner@fashionvn.com</a><br/>
  Hotline: <a href="tel:1900636899">1900 636 899</a></p>
</div>
HTML,
                'sort' => 1,
                'status' => 1,
            ],
            [
                'title' => 'Chính sách bảo mật',
                'alias' => 'privacy-policy',
                'image' => null,
                'content' => <<<'HTML'
<div class="cms-policy">
  <h1>Chính Sách Bảo Mật</h1>
  <p class="lead">Fashion VN cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân.</p>

  <h2>1. Thông tin chúng tôi thu thập</h2>
  <ul>
    <li><strong>Thông tin tài khoản:</strong> Họ tên, email, số điện thoại khi bạn đăng ký tài khoản</li>
    <li><strong>Thông tin đặt hàng:</strong> Địa chỉ giao hàng, phương thức thanh toán</li>
    <li><strong>Thông tin duyệt web:</strong> Cookie, IP address, thiết bị sử dụng</li>
  </ul>

  <h2>2. Mục đích sử dụng</h2>
  <ul>
    <li>Xử lý đơn hàng và giao hàng</li>
    <li>Hỗ trợ khách hàng và giải quyết khiếu nại</li>
    <li>Gửi thông tin khuyến mãi (nếu bạn đồng ý)</li>
    <li>Cải thiện trải nghiệm mua sắm</li>
  </ul>

  <h2>3. Bảo mật thông tin</h2>
  <p>Chúng tôi sử dụng mã hóa SSL/TLS cho mọi giao dịch. Thông tin thanh toán được xử lý qua cổng thanh toán bảo mật, chúng tôi <strong>không lưu trữ</strong> thông tin thẻ ngân hàng.</p>

  <h2>4. Quyền của bạn</h2>
  <ul>
    <li>Quyền truy cập và chỉnh sửa thông tin cá nhân</li>
    <li>Quyền yêu cầu xóa tài khoản</li>
    <li>Quyền từ chối nhận email quảng cáo</li>
  </ul>

  <h2>5. Liên hệ</h2>
  <p>Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ:<br/>
  Email: <a href="mailto:privacy@fashionvn.com">privacy@fashionvn.com</a><br/>
  Hotline: <a href="tel:1900636899">1900 636 899</a></p>
</div>
HTML,
                'sort' => 2,
                'status' => 1,
            ],
            [
                'title' => 'Chính sách đổi trả',
                'alias' => 'return-policy',
                'image' => null,
                'content' => <<<'HTML'
<div class="cms-policy">
  <h1>Chính Sách Đổi Trả</h1>
  <p class="lead">Fashion VN cam kết mang đến trải nghiệm mua sắm an tâm. Bạn có quyền đổi trả sản phẩm trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng.</p>

  <h2>Điều kiện đổi trả</h2>
  <ul>
    <li>Sản phẩm còn nguyên tem, mác, bao bì</li>
    <li>Chưa qua sử dụng, giặt ủi</li>
    <li>Có hóa đơn hoặc mã đơn hàng</li>
    <li>Không áp dụng cho sản phẩm giảm giá trên 50%</li>
  </ul>

  <h2>Quy trình đổi trả</h2>
  <ol>
    <li><strong>Bước 1:</strong> Liên hệ hotline <strong>1900 636 899</strong> hoặc email <a href="mailto:support@fashionvn.com">support@fashionvn.com</a></li>
    <li><strong>Bước 2:</strong> Cung cấp mã đơn hàng và lý do đổi trả</li>
    <li><strong>Bước 3:</strong> Gửi sản phẩm qua đường bưu điện (miễn phí)</li>
    <li><strong>Bước 4:</strong> Nhận sản phẩm mới hoặc hoàn tiền trong 3-5 ngày làm việc</li>
  </ol>

  <h2>Trường hợp được hoàn tiền 100%</h2>
  <ul>
    <li>Sản phẩm bị lỗi do nhà sản xuất</li>
    <li>Giao sai mẫu, sai size, sai màu</li>
    <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển</li>
  </ul>

  <h2>Phương thức hoàn tiền</h2>
  <table>
    <tr><th>Phương thức thanh toán</th><th>Hình thức hoàn</th><th>Thời gian</th></tr>
    <tr><td>COD</td><td>Chuyển khoản ngân hàng</td><td>3-5 ngày</td></tr>
    <tr><td>Chuyển khoản</td><td>Hoàn về tài khoản gốc</td><td>5-7 ngày</td></tr>
    <tr><td>Ví MoMo/ZaloPay</td><td>Hoàn về ví</td><td>1-3 ngày</td></tr>
  </table>
</div>
HTML,
                'sort' => 3,
                'status' => 1,
            ],
            [
                'title' => 'Hướng dẫn chọn size',
                'alias' => 'size-guide',
                'image' => null,
                'content' => <<<'HTML'
<div class="cms-size-guide">
  <h1>Hướng Dẫn Chọn Size</h1>
  <p class="lead">Để chọn được size phù hợp, bạn hãy tham khảo bảng size dưới đây. Nếu bạn đang phân vân giữa 2 size, hãy chọn size lớn hơn.</p>

  <h2>Bảng size Áo Nam</h2>
  <table>
    <tr><th>Size</th><th>Chiều cao (cm)</th><th>Cân nặng (kg)</th><th>Vai (cm)</th><th>Ngực (cm)</th></tr>
    <tr><td><strong>S</strong></td><td>160 - 165</td><td>50 - 58</td><td>40 - 42</td><td>86 - 92</td></tr>
    <tr><td><strong>M</strong></td><td>165 - 170</td><td>58 - 65</td><td>42 - 44</td><td>92 - 98</td></tr>
    <tr><td><strong>L</strong></td><td>170 - 175</td><td>65 - 73</td><td>44 - 46</td><td>98 - 104</td></tr>
    <tr><td><strong>XL</strong></td><td>175 - 182</td><td>73 - 82</td><td>46 - 48</td><td>104 - 110</td></tr>
  </table>

  <h2>Bảng size Áo Nữ</h2>
  <table>
    <tr><th>Size</th><th>Chiều cao (cm)</th><th>Cân nặng (kg)</th><th>Vai (cm)</th><th>Ngực (cm)</th></tr>
    <tr><td><strong>S</strong></td><td>150 - 157</td><td>40 - 48</td><td>34 - 36</td><td>78 - 84</td></tr>
    <tr><td><strong>M</strong></td><td>157 - 163</td><td>48 - 55</td><td>36 - 38</td><td>84 - 90</td></tr>
    <tr><td><strong>L</strong></td><td>163 - 168</td><td>55 - 62</td><td>38 - 40</td><td>90 - 96</td></tr>
  </table>

  <h2>Bảng size Quần Jean Nam</h2>
  <table>
    <tr><th>Size</th><th>Eo (cm)</th><th>Mông (cm)</th><th>Chiều dài (cm)</th></tr>
    <tr><td><strong>29</strong></td><td>72 - 76</td><td>88 - 92</td><td>96</td></tr>
    <tr><td><strong>30</strong></td><td>76 - 80</td><td>92 - 96</td><td>98</td></tr>
    <tr><td><strong>31</strong></td><td>80 - 84</td><td>96 - 100</td><td>100</td></tr>
    <tr><td><strong>32</strong></td><td>84 - 88</td><td>100 - 104</td><td>102</td></tr>
    <tr><td><strong>34</strong></td><td>88 - 92</td><td>104 - 108</td><td>104</td></tr>
  </table>

  <h2>Mẹo chọn size</h2>
  <ul>
    <li>Đo các số đo khi không mặc quần áo</li>
    <li>Nếu vóc dáng nằm giữa 2 size, chọn size lớn hơn cho thoải mái</li>
    <li>Áo hoodie/oversize nên chọn đúng size hoặc nhỏ hơn 1 size</li>
    <li>Nếu chưa chắc chắn, liên hệ hotline để được tư vấn miễn phí</li>
  </ul>
</div>
HTML,
                'sort' => 4,
                'status' => 1,
            ],
            [
                'title' => 'Liên hệ',
                'alias' => 'contact',
                'image' => null,
                'content' => <<<'HTML'
<div class="cms-contact">
  <h1>Liên Hệ Với Chúng Tôi</h1>
  <p class="lead">Chúng tôi luôn sẵn sàng lắng nghe bạn. Đừng ngần ngại liên hệ qua bất kỳ kênh nào dưới đây!</p>

  <div class="contact-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin:32px 0">
    <div class="contact-card" style="padding:24px;border-radius:12px;background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.1)">
      <h3>Hỗ trợ khách hàng</h3>
      <p><strong>Hotline:</strong> 1900 636 899<br/><em>(8:00 - 21:00, T2 - CN)</em></p>
      <p><strong>Email:</strong> <a href="mailto:support@fashionvn.com">support@fashionvn.com</a></p>
      <p><strong>Zalo:</strong> 0901 234 567</p>
    </div>

    <div class="contact-card" style="padding:24px;border-radius:12px;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.1)">
      <h3>Văn phòng chính</h3>
      <p><strong>Địa chỉ:</strong> Tầng 15, Tòa nhà Landmark 81,<br/>720A Điện Biên Phủ, P.22, Q.Bình Thạnh, TP.HCM</p>
      <p><strong>Giờ làm việc:</strong><br/>Thứ 2 - Thứ 6: 8:30 - 17:30<br/>Thứ 7: 9:00 - 12:00</p>
    </div>

    <div class="contact-card" style="padding:24px;border-radius:12px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.1)">
      <h3>Hợp tác kinh doanh</h3>
      <p><strong>Email:</strong> <a href="mailto:partner@fashionvn.com">partner@fashionvn.com</a></p>
      <p><strong>Tel:</strong> 028 3636 8999</p>
      <p>Nhượng quyền, đại lý, đối tác logistics</p>
    </div>
  </div>

  <h2>Theo dõi chúng tôi</h2>
  <p>
    <a href="https://facebook.com/fashionvn" target="_blank">Facebook</a> •
    <a href="https://instagram.com/fashionvn" target="_blank">Instagram</a> •
    <a href="https://tiktok.com/@fashionvn" target="_blank">TikTok</a> •
    <a href="https://youtube.com/@fashionvn" target="_blank">YouTube</a>
  </p>
</div>
HTML,
                'sort' => 5,
                'status' => 1,
            ],
        ];
        foreach ($pages as $p) {
            $p['created_at'] = $p['updated_at'] = now();
            $db->table('cms_pages')->insert($p);
        }

        // ═══════════════════════════════
        // System Configs — Store Branding
        // ═══════════════════════════════
        echo "🏪 Seeding system configs (store branding)...\n";
        $db->table('system_configs')->where('group_name', 'store')->delete();
        $db->table('system_configs')->where('group_name', 'storefront_layout')->delete();

        $storeConfigs = [
            ['group_name' => 'store', 'key' => 'shop_name', 'value' => 'Fashion VN'],
            ['group_name' => 'store', 'key' => 'shop_tagline', 'value' => 'Thời trang Việt — Phong cách quốc tế'],
            ['group_name' => 'store', 'key' => 'description', 'value' => 'Fashion VN — Thương hiệu thời trang hàng đầu Việt Nam. Thiết kế hiện đại, chất liệu cao cấp, giá cả hợp lý. Miễn phí giao hàng cho đơn từ 500K.'],
            ['group_name' => 'store', 'key' => 'logo', 'value' => '/storage/clothing/logo.png'],
            ['group_name' => 'store', 'key' => 'favicon', 'value' => '/storage/clothing/favicon.ico'],
            ['group_name' => 'store', 'key' => 'email', 'value' => 'support@fashionvn.com'],
            ['group_name' => 'store', 'key' => 'phone', 'value' => '1900 636 899'],
            ['group_name' => 'store', 'key' => 'address', 'value' => 'Tầng 15, Landmark 81, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM'],
            ['group_name' => 'store', 'key' => 'hotline', 'value' => '1900 636 899'],
            ['group_name' => 'store', 'key' => 'zalo', 'value' => '0901234567'],
            ['group_name' => 'store', 'key' => 'facebook', 'value' => 'https://facebook.com/fashionvn'],
            ['group_name' => 'store', 'key' => 'instagram', 'value' => 'https://instagram.com/fashionvn'],
            ['group_name' => 'store', 'key' => 'tiktok', 'value' => 'https://tiktok.com/@fashionvn'],
            ['group_name' => 'store', 'key' => 'youtube', 'value' => 'https://youtube.com/@fashionvn'],
            ['group_name' => 'store', 'key' => 'copyright', 'value' => '© 2026 Fashion VN. All rights reserved.'],
            ['group_name' => 'store', 'key' => 'currency', 'value' => 'VND'],
            ['group_name' => 'store', 'key' => 'currency_symbol', 'value' => '₫'],
            ['group_name' => 'store', 'key' => 'free_shipping_threshold', 'value' => '500000'],
            ['group_name' => 'store', 'key' => 'meta_title', 'value' => 'Fashion VN — Thời Trang Việt Nam Chất Lượng Cao'],
            ['group_name' => 'store', 'key' => 'meta_description', 'value' => 'Mua sắm thời trang nam nữ online tại Fashion VN. Thiết kế Việt, chất lượng quốc tế. Miễn phí giao hàng toàn quốc.'],
        ];

        foreach ($storeConfigs as $sc) {
            $sc['created_at'] = $sc['updated_at'] = now();
            $db->table('system_configs')->insert($sc);
        }

        // ═══════════════════════════════
        // System Configs — Storefront Layout
        // ═══════════════════════════════
        echo "🎨 Seeding storefront layout config...\n";
        $layoutSections = json_encode([
            ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 4000, 'height' => 'lg']],
            ['type' => 'categories', 'enabled' => true, 'order' => 1, 'params' => ['columns' => 5, 'showDescription' => true]],
            ['type' => 'flash_sale', 'enabled' => true, 'order' => 2, 'params' => ['showTimer' => true, 'showProgress' => true]],
            ['type' => 'featured_products', 'enabled' => true, 'order' => 3, 'params' => ['title' => 'Sản phẩm bán chạy', 'count' => 8, 'columns' => 4]],
            ['type' => 'testimonials', 'enabled' => true, 'order' => 4, 'params' => ['title' => 'Khách hàng nói gì', 'columns' => 3], 'content' => [
                ['name' => 'Trần Minh', 'text' => 'Mua áo polo chất vải rất mềm, form đẹp. Sẽ mua tiếp!', 'rating' => 5],
                ['name' => 'Ngọc Anh', 'text' => 'Váy đầm hoa nhí quá xinh, đúng size luôn. Giao nhanh 2 ngày.', 'rating' => 5],
                ['name' => 'Hùng Nguyễn', 'text' => 'Jean slim fit co giãn tốt, mặc thoải mái cả ngày đi làm.', 'rating' => 4],
            ]],
            ['type' => 'new_arrivals', 'enabled' => true, 'order' => 5, 'params' => ['title' => 'Hàng mới về', 'count' => 4]],
            ['type' => 'newsletter', 'enabled' => true, 'order' => 6, 'params' => ['title' => 'Nhận ưu đãi độc quyền'], 'content' => []],
            ['type' => 'social_feed', 'enabled' => true, 'order' => 7, 'params' => ['title' => 'Kết nối với Fashion VN'], 'content' => [
                ['platform' => 'facebook', 'label' => 'Facebook', 'url' => 'https://facebook.com/fashionvn'],
                ['platform' => 'instagram', 'label' => 'Instagram', 'url' => 'https://instagram.com/fashionvn'],
                ['platform' => 'tiktok', 'label' => 'TikTok', 'url' => 'https://tiktok.com/@fashionvn'],
                ['platform' => 'youtube', 'label' => 'YouTube', 'url' => 'https://youtube.com/@fashionvn'],
            ]],
            ['type' => 'cms_pages', 'enabled' => true, 'order' => 8, 'params' => ['layout' => 'grid', 'maxPages' => 6]],
        ]);
        $layoutPages = json_encode([
            'cart' => true, 'account' => true, 'auth' => true,
            'order_tracking' => true, 'products' => true,
        ]);

        $layoutConfigs = [
            ['group_name' => 'storefront_layout', 'key' => 'layout_sections', 'value' => $layoutSections],
            ['group_name' => 'storefront_layout', 'key' => 'layout_pages', 'value' => $layoutPages],
            ['group_name' => 'storefront_layout', 'key' => 'layout_template', 'value' => 'full_store'],
            ['group_name' => 'storefront_layout', 'key' => 'layout_custom_css', 'value' => '/* Fashion VN Custom */
.section-title { letter-spacing: -0.5px; }
.cms-about .lead, .cms-policy .lead, .cms-contact .lead { font-size: 18px; color: var(--sf-text-secondary); line-height: 1.7; }
.cms-about table, .cms-policy table, .cms-size-guide table { width: 100%; border-collapse: collapse; margin: 16px 0; }
.cms-about table td, .cms-about table th, .cms-policy table td, .cms-policy table th, .cms-size-guide table td, .cms-size-guide table th { padding: 10px 14px; border: 1px solid var(--sf-border); text-align: left; }
.cms-about table th, .cms-policy table th, .cms-size-guide table th { background: var(--sf-bg-card); font-weight: 700; }'],
            ['group_name' => 'storefront_layout', 'key' => 'storefront_url', 'value' => 'https://fashionvn.store'],
        ];
        foreach ($layoutConfigs as $lc) {
            $lc['created_at'] = $lc['updated_at'] = now();
            $db->table('system_configs')->insert($lc);
        }

        // ═══════════════════════════════
        // Nav Links (Header + Footer)
        // ═══════════════════════════════
        echo "🔗 Seeding nav links...\n";
        $db->table('nav_links')->delete();
        $navLinks = [
            // Header links
            ['label' => 'Sản phẩm', 'url' => '/products', 'type' => 'header', 'sort' => 1, 'status' => 1, 'parent_id' => null],
            ['label' => 'Flash Sale', 'url' => '/#flash-sale', 'type' => 'header', 'sort' => 2, 'status' => 1, 'parent_id' => null],
            ['label' => 'Về chúng tôi', 'url' => '/page/about', 'type' => 'header', 'sort' => 3, 'status' => 1, 'parent_id' => null],
            ['label' => 'Liên hệ', 'url' => '/page/contact', 'type' => 'header', 'sort' => 4, 'status' => 1, 'parent_id' => null],
            // Footer links
            ['label' => 'Về chúng tôi', 'url' => '/page/about', 'type' => 'footer', 'sort' => 1, 'status' => 1, 'parent_id' => null],
            ['label' => 'Chính sách đổi trả', 'url' => '/page/return-policy', 'type' => 'footer', 'sort' => 2, 'status' => 1, 'parent_id' => null],
            ['label' => 'Chính sách bảo mật', 'url' => '/page/privacy-policy', 'type' => 'footer', 'sort' => 3, 'status' => 1, 'parent_id' => null],
            ['label' => 'Hướng dẫn chọn size', 'url' => '/page/size-guide', 'type' => 'footer', 'sort' => 4, 'status' => 1, 'parent_id' => null],
            ['label' => 'Liên hệ', 'url' => '/page/contact', 'type' => 'footer', 'sort' => 5, 'status' => 1, 'parent_id' => null],
        ];
        foreach ($navLinks as $nl) {
            $nl['created_at'] = $nl['updated_at'] = now();
            $db->table('nav_links')->insert($nl);
        }

        // ═══════════════════════════════
        // Sample Customers
        // ═══════════════════════════════
        echo "🧑 Seeding customers...\n";
        $customerIds = [];
        $customers = [
            ['nickname' => 'Trần Văn Minh', 'unique_id' => 'minh_tran_01', 'platform' => 'web', 'email' => 'minh.tran@gmail.com', 'phone' => '0901234567', 'address' => '123 Nguyễn Huệ, Q.1, TP.HCM'],
            ['nickname' => 'Lê Thị Mai', 'unique_id' => 'mai_le_02', 'platform' => 'web', 'email' => 'mai.le@gmail.com', 'phone' => '0912345678', 'address' => '456 Lê Lợi, Q.3, TP.HCM'],
            ['nickname' => 'Nguyễn Hùng', 'unique_id' => 'hung_nguyen_03', 'platform' => 'web', 'email' => 'hung.nguyen@gmail.com', 'phone' => '0923456789', 'address' => '789 Hai Bà Trưng, Q.1, TP.HCM'],
            ['nickname' => 'Phạm Ngọc Anh', 'unique_id' => 'ngocanh_pham_04', 'platform' => 'web', 'email' => 'ngocanh.pham@gmail.com', 'phone' => '0934567890', 'address' => '321 Trần Hưng Đạo, Q.5, TP.HCM'],
        ];
        foreach ($customers as $c) {
            $c['created_at'] = $c['updated_at'] = now();
            $customerIds[] = $db->table('customers')->insertGetId($c);
        }

        // ═══════════════════════════════
        // Sample Orders
        // ═══════════════════════════════
        echo "🛒 Seeding orders...\n";
        $statuses = ['pending', 'confirmed', 'shipping', 'completed', 'completed'];
        $paymentStatuses = ['unpaid', 'paid', 'paid', 'paid', 'paid'];
        $productSkus = array_keys($productIds);

        for ($i = 0; $i < 5; $i++) {
            $custIdx = $i % count($customerIds);
            $orderId = $db->table('orders')->insertGetId([
                'customer_id' => $customerIds[$custIdx],
                'customer_name' => $customers[$custIdx]['nickname'],
                'customer_phone' => $customers[$custIdx]['phone'],
                'customer_address' => $customers[$custIdx]['address'],
                'status' => $statuses[$i],
                'payment_status' => $paymentStatuses[$i],
                'payment_method' => $i % 2 === 0 ? 'cod' : 'bank_transfer',
                'total_amount' => 0,
                'notes' => $i === 0 ? 'Giao giờ hành chính' : null,
                'created_at' => now()->subDays(5 - $i),
                'updated_at' => now()->subDays(5 - $i),
            ]);

            $numItems = ($i % 2) + 2;
            $orderTotal = 0;
            for ($j = 0; $j < $numItems; $j++) {
                $pSku = $productSkus[($i + $j) % count($productSkus)];
                $pId = $productIds[$pSku];
                $qty = ($j % 2) + 1;
                $price = $products[($i + $j) % count($products)]['price'];
                $lineTotal = $price * $qty;
                $orderTotal += $lineTotal;

                $db->table('order_details')->insert([
                    'order_id' => $orderId,
                    'product_id' => $pId,
                    'name' => $products[($i + $j) % count($products)]['name'],
                    'sku' => $pSku,
                    'qty' => $qty,
                    'price' => $price,
                    'total_price' => $lineTotal,
                    'created_at' => now()->subDays(5 - $i),
                ]);
            }

            $db->table('orders')->where('id', $orderId)->update([
                'total_amount' => $orderTotal,
            ]);
        }

        echo "\n✅ ClothingTenantSeeder completed! 🎉\n";
        echo "   📂 5 categories | 🏷️ 4 brands | 👕 10 products | 🎨 {$totalVariants} variants\n";
        echo "   🖼️ 3 banners | 📝 5 CMS pages | 🧑 4 customers | 🛒 5 orders\n";
        echo "   🏪 20 store configs | 🎨 4 layout configs | 🔗 9 nav links\n";
        echo "\n   🔐 CMS Login: admin@fashionvn.com / password\n";
    }
}

