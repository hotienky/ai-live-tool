<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class TenantBdsSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_bds');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;

        echo "🗑️  Clearing old bds data...\n";
        $db->table('property_images')->delete();
        $db->table('property_inquiries')->delete();
        $db->table('contents')->where('type', 'listing')->delete();
        $db->table('cms_pages')->delete();
        $db->table('nav_links')->delete();

        $authorId = $db->table('users')->first()->id ?? null;

        // 1. Properties (Contents table, type='listing')
        $imgBase = 'https://placehold.co/800x600/ca8a04/ffffff?text=';
        $listings = [
            [
                'type' => 'listing', 'slug' => 'nha-pho-quan-1', 'title' => 'Nhà Phố Trung Tâm Quận 1, Giá Tốt',
                'excerpt' => 'Nhà mặt tiền đường lớn, thích hợp kinh doanh',
                'body' => '<p>Diện tích 100m2, 1 trệt 3 lầu.</p>',
                'featured_image' => $imgBase.'House+1',
                'status' => 'published', 'author_id' => $authorId, 'published_at' => now(),
                'meta' => json_encode(['price' => 15000000000, 'area' => 100, 'bedrooms' => 4, 'bathrooms' => 4, 'type' => 'sell', 'property_type' => 'house', 'location' => 'Quận 1, TP.HCM']),
            ],
            [
                'type' => 'listing', 'slug' => 'can-ho-vinhome-central-park', 'title' => 'Căn hộ 2PN Vinhomes Central Park Cho Thuê',
                'excerpt' => 'View sông thoáng mát, nội thất cao cấp',
                'body' => '<p>Diện tích 85m2, đầy đủ nội thất dọn vào ở ngay.</p>',
                'featured_image' => $imgBase.'Apartment+1',
                'status' => 'published', 'author_id' => $authorId, 'published_at' => now(),
                'meta' => json_encode(['price' => 25000000, 'area' => 85, 'bedrooms' => 2, 'bathrooms' => 2, 'type' => 'rent', 'property_type' => 'apartment', 'location' => 'Bình Thạnh, TP.HCM']),
            ],
            [
                'type' => 'listing', 'slug' => 'biet-thu-quan-7', 'title' => 'Biệt thự góc 2 mặt tiền Phú Mỹ Hưng',
                'excerpt' => 'Biệt thự đơn lập, an ninh 24/7',
                'body' => '<p>Diện tích 300m2, thiết kế cổ điển.</p>',
                'featured_image' => $imgBase.'Villa',
                'status' => 'published', 'author_id' => $authorId, 'published_at' => now(),
                'meta' => json_encode(['price' => 50000000000, 'area' => 300, 'bedrooms' => 5, 'bathrooms' => 6, 'type' => 'sell', 'property_type' => 'villa', 'location' => 'Quận 7, TP.HCM']),
            ]
        ];

        foreach ($listings as $idx => $l) {
            $l['created_at'] = $l['updated_at'] = now();
            $id = $db->table('contents')->insertGetId($l);
            
            // Generate some property images
            $db->table('property_images')->insert([
                ['listing_id' => $id, 'url' => $imgBase."Gallery^{$idx}-1", 'is_primary' => $true, 'created_at' => now(), 'updated_at' => now()],
                ['listing_id' => $id, 'url' => $imgBase."Gallery^{$idx}-2", 'is_primary' => false, 'created_at' => now(), 'updated_at' => now()]
            ]);
        }
        echo "✅ Seeded Properties\n";

        // 2. CMS Pages
        $db->table('cms_pages')->insert([
            ['title' => 'Trang chủ', 'alias' => 'home', 'content' => '<div style="background: linear-gradient(135deg, var(--sf-accent) 0%, #1e3a8a 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Tìm kiếm Bất Động Sản Hoàn Hảo</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Nền tảng mua bán và cho thuê nhà đất uy tín, cập nhật các dự án mới nhất mỗi ngày.</p>
                <a href="/listings" class="btn btn--primary" style="background: white; color: var(--sf-accent); padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Khám Phá Dự Án</a>
            </div>', 'status' => $true, 'sort' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Giới thiệu công ty', 'alias' => 'gioi-thieu', 'content' => '<h2>Golden Land Bất Động Sản</h2>...', 'status' => $true, 'sort' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 3. Nav Links
        $db->table('nav_links')->insert([
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Bán', 'url' => '/listings?type=sell', 'icon' => 'Key', 'sort_order' => 2, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Cho thuê', 'url' => '/listings?type=rent', 'icon' => 'Home', 'sort_order' => 3, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Liên hệ', 'url' => '/contact', 'icon' => 'Phone', 'sort_order' => 4, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded Nav Links\n";

        // 4. Set Storefront Layout (Homepage Block configuration)
        $db->table('system_configs')->where('group_name', 'storefront_layout')->where('key', 'layout_sections')->delete();
        $db->table('system_configs')->insert([
            'group_name' => 'storefront_layout',
            'key' => 'layout_sections',
            'value' => json_encode([
                ["type" => "banner", "enabled" => true, "order" => 0, "params" => ["autoplay" => true, "interval" => 5000, "height" => "md"]],
                ["type" => "property_listings", "enabled" => true, "order" => 1, "params" => ["title" => "Bất Động Sản Nổi Bật", "subtitle" => "Tìm ngôi nhà mơ ước của bạn", "count" => 6]],
                ["type" => "cms_pages", "enabled" => true, "order" => 2, "params" => ["layout" => "grid", "maxPages" => 6]],
                ["type" => "trust_badges", "enabled" => true, "order" => 3, "params" => []]
            ]),
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "✅ Seeded Homepage Layout\n";
    }
}
