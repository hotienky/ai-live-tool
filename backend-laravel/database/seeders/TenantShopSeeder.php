<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class TenantShopSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_shop');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;
        $false = $isPgsql ? DB::raw('false') : false;

        echo "🗑️  Clearing old shop data...\n";
        $db->table('product_categories')->delete();
        $db->table('products')->delete();
        $db->table('cms_pages')->delete();
        $db->table('nav_links')->delete();

        // 1. Categories
        $cats = [
            ['name' => 'Áo thun', 'slug' => 'ao-thun', 'description' => 'Áo thun nam nữ các loại', 'sort_order' => 1, 'is_active' => $true],
            ['name' => 'Quần Jeans', 'slug' => 'quan-jeans', 'description' => 'Quần jeans thời trang', 'sort_order' => 2, 'is_active' => $true],
            ['name' => 'Váy đầm', 'slug' => 'vay-dam', 'description' => 'Váy đầm công sở, dạo phố', 'sort_order' => 3, 'is_active' => $true],
            ['name' => 'Áo khoác', 'slug' => 'ao-khoac', 'description' => 'Áo khoác mùa đông, áo gió', 'sort_order' => 4, 'is_active' => $true],
            ['name' => 'Phụ kiện', 'slug' => 'phu-kien', 'description' => 'Túi xách, mũ nón, thắt lưng', 'sort_order' => 5, 'is_active' => $true],
        ];

        $categoryIds = [];
        foreach ($cats as $c) {
            $c['created_at'] = $c['updated_at'] = now();
            $categoryIds[] = $db->table('product_categories')->insertGetId($c);
        }
        echo "✅ Seeded Categories\n";

        // 2. Products
        $imgBase = 'https://placehold.co/800x800/eeeeee/333333?text=';
        $products = [
            [
                'name' => 'Áo Thun Basic Cotton 100%',
                'sku' => 'TSHIRT-001',
                'slug' => 'ao-thun-basic-cotton-100',
                'price' => 150000,
                'cost_price' => 80000,
                'image_url' => $imgBase . 'T-Shirt',
                'images' => json_encode([$imgBase . 'T-Shirt', $imgBase . 'T-Shirt-Back']),
                'category_id' => $categoryIds[0] ?? null,
                'stock' => 100,
                'is_active' => $true,
                'is_featured' => $true,
            ],
            [
                'name' => 'Quần Jeans Xanh Classic',
                'sku' => 'JEANS-001',
                'slug' => 'quan-jeans-xanh-classic',
                'price' => 350000,
                'cost_price' => 150000,
                'promotion_price' => 299000,
                'promotion_start' => now()->subDays(1),
                'promotion_end' => now()->addDays(30),
                'image_url' => $imgBase . 'Jeans',
                'images' => json_encode([$imgBase . 'Jeans']),
                'category_id' => $categoryIds[1] ?? null,
                'stock' => 50,
                'is_active' => $true,
                'is_featured' => $true,
            ],
            [
                'name' => 'Váy Đầm Hoa Mùa Hè',
                'sku' => 'DRESS-001',
                'slug' => 'vay-dam-hoa-mua-he',
                'price' => 280000,
                'cost_price' => 120000,
                'image_url' => $imgBase . 'Summer+Dress',
                'images' => json_encode([$imgBase . 'Summer+Dress']),
                'category_id' => $categoryIds[2] ?? null,
                'stock' => 30,
                'is_active' => $true,
                'is_featured' => $false,
            ],
            [
                'name' => 'Áo Khoác Bomber Nam Nữ',
                'sku' => 'BOMBER-001',
                'slug' => 'ao-khoac-bomber',
                'price' => 450000,
                'cost_price' => 200000,
                'promotion_price' => 350000,
                'promotion_start' => now()->subDays(5),
                'promotion_end' => now()->addDays(10),
                'image_url' => $imgBase . 'Bomber+Jacket',
                'images' => json_encode([$imgBase . 'Bomber+Jacket']),
                'category_id' => $categoryIds[3] ?? null,
                'stock' => 40,
                'is_active' => $true,
                'is_featured' => $true,
            ],
            [
                'name' => 'Mũ Lưỡi Trai Phong Cách',
                'sku' => 'CAP-001',
                'slug' => 'mu-luoi-trai-phong-cach',
                'price' => 85000,
                'cost_price' => 30000,
                'image_url' => $imgBase . 'Cap',
                'images' => json_encode([$imgBase . 'Cap']),
                'category_id' => $categoryIds[4] ?? null,
                'stock' => 200,
                'is_active' => $true,
                'is_featured' => $false,
            ],
        ];

        foreach ($products as $p) {
            $p['created_at'] = $p['updated_at'] = now();
            $db->table('products')->insert($p);
        }
        echo "✅ Seeded Products\n";

        // 3. CMS Pages
        $db->table('cms_pages')->insert([
            ['title' => 'Chính sách đổi trả', 'alias' => 'chinh-sach-doi-tra', 'content' => '<h2>Đổi trả trong 7 ngày</h2>...', 'status' => $true, 'sort' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Hướng dẫn chọn size', 'alias' => 'huong-dan-chon-size', 'content' => '<h2>Bảng size quần áo</h2>...', 'status' => $true, 'sort' => 2, 'created_at' => now(), 'updated_at' => now()]
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 4. Nav Links
        $db->table('nav_links')->insert([
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Sản phẩm', 'url' => '/products', 'icon' => 'ShoppingBag', 'sort_order' => 2, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Áo thun', 'url' => '/category/ao-thun', 'icon' => 'Tag', 'sort_order' => 3, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Váy đầm', 'url' => '/category/vay-dam', 'icon' => 'Tag', 'sort_order' => 4, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Chính sách', 'url' => '/page/chinh-sach-doi-tra', 'icon' => 'FileText', 'sort_order' => 5, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded Nav Links\n";
    }
}
