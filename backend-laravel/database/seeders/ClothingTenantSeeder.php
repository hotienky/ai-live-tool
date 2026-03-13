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
        // CMS Pages
        // ═══════════════════════════════
        echo "📝 Seeding CMS pages...\n";
        $pages = [
            ['title' => 'Về chúng tôi', 'alias' => 'about', 'content' => '<h1>Fashion VN</h1><p>Thương hiệu thời trang Việt Nam với sứ mệnh mang đến sản phẩm chất lượng, giá hợp lý.</p>', 'sort' => 1, 'status' => 1],
            ['title' => 'Chính sách đổi trả', 'alias' => 'return-policy', 'content' => '<h1>Chính Sách Đổi Trả</h1><p>Đổi trả miễn phí trong <strong>30 ngày</strong>.</p><ul><li>Còn nguyên tem mác</li><li>Chưa qua sử dụng</li><li>Có hóa đơn mua hàng</li></ul>', 'sort' => 2, 'status' => 1],
            ['title' => 'Hướng dẫn chọn size', 'alias' => 'size-guide', 'content' => '<h1>Hướng Dẫn Chọn Size</h1><h2>Nam</h2><table><tr><th>Size</th><th>Chiều cao</th><th>Cân nặng</th></tr><tr><td>S</td><td>160-165cm</td><td>50-58kg</td></tr><tr><td>M</td><td>165-170cm</td><td>58-65kg</td></tr><tr><td>L</td><td>170-175cm</td><td>65-73kg</td></tr><tr><td>XL</td><td>175-182cm</td><td>73-82kg</td></tr></table>', 'sort' => 3, 'status' => 1],
        ];
        foreach ($pages as $p) {
            $p['created_at'] = $p['updated_at'] = now();
            $db->table('cms_pages')->insert($p);
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

        // Shop settings table doesn't exist in this schema — skipped

        echo "\n✅ ClothingTenantSeeder completed! 🎉\n";
        echo "   📂 5 categories | 🏷️ 4 brands | 👕 10 products | 🎨 {$totalVariants} variants\n";
        echo "   🖼️ 3 banners | 📝 3 CMS pages | 🧑 4 customers | 🛒 5 orders\n";
        echo "\n   🔐 CMS Login: admin@fashionvn.com / password\n";
    }
}
