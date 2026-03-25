<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class TenantServiceSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_service');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;

        echo "🗑️  Clearing old service data...\n";
        $db->table('booking_appointments')->delete();
        $db->table('booking_services')->delete();
        $db->table('cms_pages')->delete();
        $db->table('nav_links')->delete();

        // 1. Booking Services
        $imgBase = 'https://placehold.co/800x600/14b8a6/ffffff?text=';
        $services = [
            ['title' => 'Tư vấn Thiết kế nội thất', 'description' => 'Khảo sát và tư vấn 1-1 tại nhà', 'duration_minutes' => 60, 'price' => 500000, 'category' => 'Tư vấn', 'image' => $imgBase.'Consulting', 'is_active' => $true],
            ['title' => 'Dọn dẹp nhà cửa toàn diện', 'description' => 'Gói dọn dẹp sâu 3 giờ cho căn hộ 2PN', 'duration_minutes' => 180, 'price' => 800000, 'category' => 'Giúp việc', 'image' => $imgBase.'Cleaning', 'is_active' => $true],
            ['title' => 'Sửa chữa điện nước', 'description' => 'Khắc phục các sự cố điện nước khẩn cấp', 'duration_minutes' => 60, 'price' => 200000, 'category' => 'Sửa chữa', 'image' => $imgBase.'Repair', 'is_active' => $true],
            ['title' => 'Chăm sóc người già', 'description' => 'Gói chăm sóc chuyên nghiệp theo ca', 'duration_minutes' => 240, 'price' => 450000, 'category' => 'Y tế', 'image' => $imgBase.'Care', 'is_active' => $true],
            ['title' => 'Bảo dưỡng Máy lạnh', 'description' => 'Vệ sinh, bơm gas, kiểm tra tổng quát', 'duration_minutes' => 45, 'price' => 150000, 'category' => 'Sửa chữa', 'image' => $imgBase.'AC+Service', 'is_active' => $true],
        ];

        $serviceIds = [];
        foreach ($services as $s) {
            $s['created_at'] = $s['updated_at'] = now();
            $serviceIds[] = $db->table('booking_services')->insertGetId($s);
        }
        echo "✅ Seeded Booking Services\n";

        // 2. Booking Appointments
        $appointments = [
            ['service_id' => $serviceIds[0], 'customer_name' => 'Nguyễn Văn A', 'customer_email' => 'a@user.com', 'customer_phone' => '0901234567', 'date' => now()->addDays(2)->format('Y-m-d'), 'time_slot' => '09:00 - 10:00', 'status' => 'confirmed'],
            ['service_id' => $serviceIds[1], 'customer_name' => 'Trần Thị B', 'customer_email' => 'b@user.com', 'customer_phone' => '0912345678', 'date' => now()->addDays(3)->format('Y-m-d'), 'time_slot' => '14:00 - 17:00', 'status' => 'pending'],
        ];
        foreach ($appointments as $a) {
            $a['created_at'] = $a['updated_at'] = now();
            $db->table('booking_appointments')->insert($a);
        }
        echo "✅ Seeded Booking Appointments\n";

        // 3. CMS Pages
        $db->table('cms_pages')->insert([
            ['title' => 'Trang chủ', 'alias' => 'home', 'content' => '<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Dịch Vụ Chuyên Nghiệp Mọi Lúc</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Kết nối bạn với những chuyên gia và người thợ lành nghề nhất trong mọi lĩnh vực.</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="/services" class="btn btn--primary" style="background: white; color: #0284c7; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Xem Dịch Vụ</a>
                    <a href="/booking" class="btn btn--outline" style="border-color: white; color: white; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Đặt Lịch Khảo Sát</a>
                </div>
            </div>', 'status' => $true, 'sort' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Giới thiệu dịch vụ', 'alias' => 'gioi-thieu', 'content' => '<h2>Về BookPro</h2>...', 'status' => $true, 'sort' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Bảng giá niêm yết', 'alias' => 'bang-gia', 'content' => '<h2>Bảng giá</h2>...', 'status' => $true, 'sort' => 2, 'created_at' => now(), 'updated_at' => now()]
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 4. Nav Links
        $db->table('nav_links')->insert([
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Dịch vụ', 'url' => '/services', 'icon' => 'Tool', 'sort_order' => 2, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Bảng giá', 'url' => '/page/bang-gia', 'icon' => 'DollarSign', 'sort_order' => 3, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
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
                ["type" => "booking_services", "enabled" => true, "order" => 1, "params" => ["title" => "Dịch Vụ Nổi Bật", "subtitle" => "Đặt lịch dễ dàng, nhanh chóng", "count" => 6]],
                ["type" => "cms_pages", "enabled" => true, "order" => 2, "params" => ["layout" => "grid", "maxPages" => 6]],
                ["type" => "trust_badges", "enabled" => true, "order" => 3, "params" => []]
            ]),
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "✅ Seeded Homepage Layout\n";
    }
}
