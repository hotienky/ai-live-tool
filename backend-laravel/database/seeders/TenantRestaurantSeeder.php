<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class TenantRestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_restaurant');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;

        echo "🗑️  Clearing old restaurant data...\n";
        $db->table('restaurant_tables')->delete();
        $db->table('menu_categories')->delete();
        $db->table('menu_items')->delete();
        $db->table('cms_pages')->delete();
        $db->table('nav_links')->delete();
        $db->table('media')->where('disk', 'media')->where('path', 'like', "%tenant_restaurant%")->delete(); // Clear media table for tenant

        // 1. Menu Categories
        $cats = [
            ['name' => 'Khai vị', 'slug' => 'khai-vi', 'description' => 'Các món ăn nhẹ đầu bữa', 'sort_order' => 1, 'is_active' => $true],
            ['name' => 'Món chính', 'slug' => 'mon-chinh', 'description' => 'Các món no đặc sắc', 'sort_order' => 2, 'is_active' => $true],
            ['name' => 'Tráng miệng', 'slug' => 'trang-mieng', 'description' => 'Đồ ngọt và hoa quả', 'sort_order' => 3, 'is_active' => $true],
            ['name' => 'Đồ uống', 'slug' => 'do-uong', 'description' => 'Bia, rượu, nước ngọt', 'sort_order' => 4, 'is_active' => $true],
        ];
        $categories = []; // Changed to associative array for easier lookup
        foreach ($cats as $c) {
            $c['created_at'] = $c['updated_at'] = now();
            $slug = $c['slug']; // Keep slug for lookup
            unset($c['slug']); // menu_categories has no slug column
            $categories[$slug] = $db->table('menu_categories')->insertGetId($c);
        }
        echo "✅ Seeded Menu Categories\n";

        // 3. Setup Media Paths
        $year = now()->format('Y');
        $month = now()->format('m');
        $mediaDir = "media/tenant_restaurant/{$year}/{$month}";
        $mediaPrefix = "/storage/{$mediaDir}";

        // Ensure directory exists
        \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory($mediaDir);
        
        $images = [
            'pho_bo' => "{$mediaPrefix}/pho_bo.png",
            'bun_cha' => "{$mediaPrefix}/bun_cha.png",
            'goi_cuon' => "{$mediaPrefix}/goi_cuon.png",
            'tra_vai' => "{$mediaPrefix}/tra_vai.png",
            'che_khuc_bach' => "{$mediaPrefix}/che_khuc_bach.png",
        ];

        // Physically copy template files to correct media directory
        foreach (['pho_bo', 'bun_cha', 'goi_cuon', 'tra_vai', 'che_khuc_bach'] as $imgName) {
            $src = storage_path("app/seeds/menu/{$imgName}.png");
            $dest = \Illuminate\Support\Facades\Storage::disk('public')->path("{$mediaDir}/{$imgName}.png");
            if (file_exists($src)) {
                copy($src, $dest);
            }
        }

        // Seed Media table so they appear in Admin Panel Media Manager
        foreach ($images as $imgName => $url) {
            $db->table('media')->insert([
                'filename' => "{$imgName}.png",
                'disk' => 'media',
                'path' => "{$mediaDir}/{$imgName}.png",
                'mime_type' => 'image/png',
                'size' => 50000,
                'width' => 800,
                'height' => 800,
                'alt' => str_replace('_', ' ', $imgName),
                'title' => str_replace('_', ' ', $imgName),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo "✅ Seeded Media files\n";

        // 4. Seed Menu Items
        $db->table('menu_items')->truncate();
        $db->table('menu_items')->insert([
            'category_id' => $categories['mon-chinh'],
            'name' => 'Phở bò Wagyu',
            'image' => $images['pho_bo'],
            'price' => 150000,
            'description' => 'Phở bò truyền thống với thịt bò Wagyu thượng hạng, nước dùng hầm xương 24h.',
            'created_at' => now(), 'updated_at' => now()
        ]);
        $db->table('menu_items')->insert([
            'category_id' => $categories['mon-chinh'],
            'name' => 'Bún chả Hà Nội',
            'image' => $images['bun_cha'],
            'price' => 85000,
            'description' => 'Bún chả nướng than hoa mềm ngọt, ăn kèm nước mắm chua ngọt và rau sống thanh mát.',
            'created_at' => now(), 'updated_at' => now()
        ]);
        $db->table('menu_items')->insert([
            'category_id' => $categories['khai-vi'],
            'name' => 'Gỏi cuốn tôm thịt',
            'image' => $images['goi_cuon'],
            'price' => 65000,
            'description' => 'Gỏi cuốn tươi mát với tôm sú và thịt ba chỉ, chấm cùng tương đậu phụng đặc biệt.',
            'created_at' => now(), 'updated_at' => now()
        ]);
        $db->table('menu_items')->insert([
            'category_id' => $categories['do-uong'],
            'name' => 'Trà vải nhiệt đới',
            'image' => $images['tra_vai'],
            'price' => 45000,
            'description' => 'Trà đen hảo hạng pha cùng nước ép vải tươi, mang lại cảm giác sảng khoái dịu nhẹ.',
            'created_at' => now(), 'updated_at' => now()
        ]);
        $db->table('menu_items')->insert([
            'category_id' => $categories['trang-mieng'],
            'name' => 'Chè khúc bạch',
            'image' => $images['che_khuc_bach'],
            'price' => 55000,
            'description' => 'Chè ngọt thanh với những viên khúc bạch dai mềm béo ngậy, kèm nhãn lồng giòn ngọt.',
            'created_at' => now(), 'updated_at' => now()
        ]);
        echo "✅ Seeded Menu Items\n";

        // 3. Restaurant Tables
        $tables = [
            ['number' => 'T1', 'capacity' => 2, 'location' => 'Trong nhà', 'is_available' => $true, 'sort_order' => 1],
            ['number' => 'T2', 'capacity' => 4, 'location' => 'Trong nhà', 'is_available' => $true, 'sort_order' => 2],
            ['number' => 'T3', 'capacity' => 6, 'location' => 'Trong nhà', 'is_available' => $true, 'sort_order' => 3],
            ['number' => 'V1', 'capacity' => 8, 'location' => 'Phòng VIP', 'is_available' => $true, 'sort_order' => 4],
            ['number' => 'B1', 'capacity' => 4, 'location' => 'Ban công', 'is_available' => $true, 'sort_order' => 5],
        ];
        foreach ($tables as $t) {
            $t['created_at'] = $t['updated_at'] = now();
            $db->table('restaurant_tables')->insert($t);
        }
        echo "✅ Seeded Restaurant Tables\n";

        // 4. CMS Pages
        $db->table('cms_pages')->insert([
            ['title' => 'Trang chủ', 'alias' => 'home', 'content' => '<div style="background: linear-gradient(135deg, #d97706 0%, #92400e 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Hương Vị Tinh Hoa Ẩm Thực</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Tận hưởng không gian sang trọng cùng những món ăn đặc sắc được chuẩn bị tỉ mỉ.</p>
                <a href="/reservations" class="btn btn--primary" style="background: white; color: #b45309; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Đặt Bàn Ngay</a>
            </div>', 'status' => $true, 'sort' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Giờ mở cửa', 'alias' => 'gio-mo-cua', 'content' => '<h2>10:00 - 22:00 Hàng ngày</h2>', 'status' => $true, 'sort' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 5. Nav Links
        $navLinks = [
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true],
            ['title' => 'Thực đơn', 'url' => '/menu', 'icon' => 'BookOpen', 'sort_order' => 2, 'is_active' => $true],
            ['title' => 'Về chúng tôi', 'url' => '/gioi-thieu', 'icon' => 'Info', 'sort_order' => 3, 'is_active' => $true],
            ['title' => 'Đặt bàn', 'url' => '/reservations', 'icon' => 'Calendar', 'sort_order' => 4, 'is_active' => $true],
            ['title' => 'Liên hệ', 'url' => '/contact', 'icon' => 'Phone', 'sort_order' => 5, 'is_active' => $true],
        ];
        foreach ($navLinks as $link) {
            $link['created_at'] = $link['updated_at'] = now();
            $db->table('nav_links')->insert($link);
        }
        echo "✅ Seeded Nav Links\n";

        // 6. Set Storefront Layout (Homepage Block configuration)
        $db->table('system_configs')->where('group_name', 'storefront_layout')->where('key', 'layout_sections')->delete();
        $db->table('system_configs')->insert([
            'group_name' => 'storefront_layout',
            'key' => 'layout_sections',
            'value' => json_encode([
                ["type" => "banner", "enabled" => true, "order" => 0, "params" => ["autoplay" => true, "interval" => 5000, "height" => "md"]],
                ["type" => "restaurant_menu", "enabled" => true, "order" => 1, "params" => ["title" => "Thực Đơn Nhà Hàng", "subtitle" => "Khám phá hương vị hoàn hảo"]],
                ["type" => "cms_pages", "enabled" => true, "order" => 2, "params" => ["layout" => "grid", "maxPages" => 6]]
            ]),
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "✅ Seeded Homepage Layout\n";
    }
}
