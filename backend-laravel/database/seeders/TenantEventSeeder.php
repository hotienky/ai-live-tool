<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

class TenantEventSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_event');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;

        echo "🗑️  Clearing old event data...\n";
        $db->table('event_registrations')->delete();
        $db->table('event_tickets')->delete();
        $db->table('content_taxonomies')->delete();
        $db->table('contents')->delete();
        $db->table('cms_pages')->delete();
        $db->table('nav_links')->delete();

        $authorId = $db->table('users')->first()->id ?? null;

        // 1. Events (Contents table, type='event')
        $events = [
            [
                'type' => 'event',
                'slug' => 'tech-summit-2026',
                'title' => 'Vietnam Tech Summit 2026',
                'excerpt' => 'Sự kiện công nghệ lớn nhất năm tại TP.HCM',
                'body' => '<p>Hội tụ các chuyên gia hàng đầu về AI, Blockchain và Cloud Computing.</p>',
                'featured_image' => 'https://placehold.co/800x400/4f46e5/ffffff?text=Tech+Summit',
                'status' => 'published',
                'author_id' => $authorId,
                'published_at' => now()->addDays(30),
                'meta' => json_encode([
                    'location' => 'GEM Center, TP.HCM',
                    'start_date' => now()->addDays(30)->format('Y-m-d H:i:s'),
                    'end_date' => now()->addDays(32)->format('Y-m-d H:i:s'),
                ]),
            ],
            [
                'type' => 'event',
                'slug' => 'marketing-workshop',
                'title' => 'Digital Marketing Workshop',
                'excerpt' => 'Khóa học ngắn hạn về Performance Marketing',
                'body' => '<p>Củng cố kiến thức SEO, SEM và Social Ads cho marketer.</p>',
                'featured_image' => 'https://placehold.co/800x400/ea580c/ffffff?text=Marketing+Workshop',
                'status' => 'published',
                'author_id' => $authorId,
                'published_at' => now()->addDays(15),
                'meta' => json_encode([
                    'location' => 'Online (Zoom)',
                    'start_date' => now()->addDays(15)->format('Y-m-d H:i:s'),
                    'end_date' => now()->addDays(15)->addHours(4)->format('Y-m-d H:i:s'),
                ]),
            ],
            [
                'type' => 'event',
                'slug' => 'indie-music-festival',
                'title' => 'Lễ hội Âm nhạc Indie Mùa Hạ',
                'excerpt' => 'Đêm nhạc sống động cùng các ban nhạc Indie hot nhất',
                'body' => '<p>Cháy hết mình cùng âm nhạc ngoài trời.</p>',
                'featured_image' => 'https://placehold.co/800x400/db2777/ffffff?text=Music+Festival',
                'status' => 'published',
                'author_id' => $authorId,
                'published_at' => now()->addDays(45),
                'meta' => json_encode([
                    'location' => 'Sân vận động Hoa Lư, TP.HCM',
                    'start_date' => now()->addDays(45)->format('Y-m-d H:i:s'),
                    'end_date' => now()->addDays(45)->addHours(8)->format('Y-m-d H:i:s'),
                ]),
            ]
        ];

        $eventIds = [];
        foreach ($events as $event) {
            $event['created_at'] = $event['updated_at'] = now();
            $id = $db->table('contents')->insertGetId($event);
            $eventIds[] = $id;
            
            // Add category (taxonomy)
            $db->table('content_taxonomies')->insert([
                ['content_id' => $id, 'taxonomy' => 'category', 'term' => 'Sự kiện', 'created_at' => now(), 'updated_at' => now()]
            ]);
        }
        echo "✅ Seeded Events (Contents)\n";

        // 2. Event Tickets
        $tickets = [
            ['event_id' => $eventIds[0], 'name' => 'Standard Pass', 'price' => 500000, 'quantity' => 500, 'sold_count' => 0, 'description' => 'Vé vào cổng tiêu chuẩn', 'is_active' => $true],
            ['event_id' => $eventIds[0], 'name' => 'VIP Pass', 'price' => 1500000, 'quantity' => 100, 'sold_count' => 0, 'description' => 'Ghế VIP + Tiệc nhẹ + Giao lưu diễn giả', 'is_active' => $true],
            
            ['event_id' => $eventIds[1], 'name' => 'Zoom Access', 'price' => 200000, 'quantity' => 1000, 'sold_count' => 0, 'description' => 'Link Zoom tham gia', 'is_active' => $true],
            
            ['event_id' => $eventIds[2], 'name' => 'Early Bird', 'price' => 250000, 'quantity' => 200, 'sold_count' => 50, 'description' => 'Vé mua sớm', 'is_active' => $true],
            ['event_id' => $eventIds[2], 'name' => 'At Door', 'price' => 350000, 'quantity' => 800, 'sold_count' => 0, 'description' => 'Vé mua tại cổng', 'is_active' => $true],
        ];

        foreach ($tickets as $t) {
            $t['created_at'] = $t['updated_at'] = now();
            $db->table('event_tickets')->insert($t);
        }
        echo "✅ Seeded Event Tickets\n";

        // 3. CMS Pages
        $db->table('cms_pages')->insert([
            ['title' => 'Trang chủ', 'alias' => 'home', 'content' => '<div style="background: linear-gradient(135deg, #f43f5e 0%, #9f1239 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Khám Phá Sự Kiện Tuyệt Vời</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Tham gia cộng đồng của chúng tôi và trải nghiệm những hoạt động không thể bỏ lỡ.</p>
                <a href="/events" class="btn btn--primary" style="background: white; color: #e11d48; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Xem Lịch Sự Kiện</a>
            </div>', 'status' => $true, 'sort' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Quy định tham gia', 'alias' => 'quy-dinh', 'content' => '<h2>Quy định chung</h2><p>Vui lòng mang theo vé điện tử...</p>', 'status' => $true, 'sort' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 4. Nav Links
        $db->table('nav_links')->insert([
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Tất cả sự kiện', 'url' => '/events', 'icon' => 'Calendar', 'sort_order' => 2, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Quy định', 'url' => '/page/quy-dinh', 'icon' => 'Info', 'sort_order' => 3, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Liên hệ', 'url' => '/contact', 'icon' => 'Mail', 'sort_order' => 4, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded Nav Links\n";

        // 5. Set Storefront Layout (Homepage Block configuration)
        $db->table('system_configs')->where('group_name', 'storefront_layout')->where('key', 'layout_sections')->delete();
        $db->table('system_configs')->insert([
            'group_name' => 'storefront_layout',
            'key' => 'layout_sections',
            'value' => json_encode([
                ["type" => "banner", "enabled" => true, "order" => 0, "params" => ["autoplay" => true, "interval" => 5000, "height" => "md"]],
                ["type" => "upcoming_events", "enabled" => true, "order" => 1, "params" => ["title" => "Sự Kiện Sắp Tới", "subtitle" => "Đừng bỏ lỡ những trải nghiệm tuyệt vời", "count" => 6]],
                ["type" => "cms_pages", "enabled" => true, "order" => 2, "params" => ["layout" => "grid", "maxPages" => 6]],
                ["type" => "trust_badges", "enabled" => true, "order" => 3, "params" => []]
            ]),
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "✅ Seeded Homepage Layout\n";
    }
}
