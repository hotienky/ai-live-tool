<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class TenantSpaSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_spa');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;

        echo "🗑️  Clearing old spa data...\n";
        $db->table('salon_appointments')->delete();
        $db->table('salon_service_staff')->delete();
        $db->table('salon_services')->delete();
        $db->table('salon_staff')->delete();
        $db->table('cms_pages')->delete();
        $db->table('nav_links')->delete();

        // 1. Salon Services
        $imgBase = 'https://placehold.co/800x600/f472b6/ffffff?text=';
        $services = [
            ['name' => 'Cắt tóc nữ Mẫu 2026', 'duration_minutes' => 45, 'price' => 200000, 'category' => 'Làm tóc', 'description' => 'Tư vấn và cắt tạo kiểu', 'image' => $imgBase.'Hair', 'is_active' => $true],
            ['name' => 'Uốn lạnh Hàn Quốc', 'duration_minutes' => 120, 'price' => 800000, 'category' => 'Làm tóc', 'description' => 'Uốn tóc công nghệ lạnh', 'image' => $imgBase.'Perm', 'is_active' => $true],
            ['name' => 'Gội đầu dưỡng sinh', 'duration_minutes' => 60, 'price' => 150000, 'category' => 'Spa', 'description' => 'Gội đầu 60 phút massage vai gáy', 'image' => $imgBase.'Spa', 'is_active' => $true],
            ['name' => 'Làm Nail cơ bản', 'duration_minutes' => 60, 'price' => 120000, 'category' => 'Nail', 'description' => 'Cắt da, sửa móng, sơn gel', 'image' => $imgBase.'Nail', 'is_active' => $true],
        ];
        $serviceIds = [];
        foreach ($services as $s) {
            $s['created_at'] = $s['updated_at'] = now();
            $serviceIds[] = $db->table('salon_services')->insertGetId($s);
        }
        echo "✅ Seeded Salon Services\n";

        // 2. Salon Staff
        $staffs = [
            ['name' => 'Thợ chính Lan', 'specialties' => json_encode(['Hair Stylist']), 'avatar' => $imgBase.'Lan', 'is_active' => $true],
            ['name' => 'Thợ chính Hương', 'specialties' => json_encode(['Nail Artist']), 'avatar' => $imgBase.'Huong', 'is_active' => $true],
            ['name' => 'Kỹ thuật viên Mai', 'specialties' => json_encode(['Spa Therapist']), 'avatar' => $imgBase.'Mai', 'is_active' => $true],
        ];
        $staffIds = [];
        foreach ($staffs as $s) {
            $s['created_at'] = $s['updated_at'] = now();
            $staffIds[] = $db->table('salon_staff')->insertGetId($s);
        }
        echo "✅ Seeded Salon Staff\n";

        // 3. Service Staff Pivot
        $db->table('salon_service_staff')->insert([
            ['service_id' => $serviceIds[0], 'staff_id' => $staffIds[0]],
            ['service_id' => $serviceIds[1], 'staff_id' => $staffIds[0]],
            ['service_id' => $serviceIds[2], 'staff_id' => $staffIds[2]],
            ['service_id' => $serviceIds[3], 'staff_id' => $staffIds[1]],
        ]);

        // 4. CMS Pages
        $db->table('cms_pages')->insert([
            ['title' => 'Trang chủ', 'alias' => 'home', 'content' => '<div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Tái Tạo Năng Lượng Tâm Hồn</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Các liệu trình chăm sóc nhan sắc và phục hồi sức khỏe được thực hiện bởi chuyên gia hàng đầu.</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="/services" class="btn btn--primary" style="background: white; color: #db2777; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Xem Bảng Giá</a>
                    <a href="/booking" class="btn btn--outline" style="border-color: white; color: white; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Đặt Lịch Hẹn</a>
                </div>
            </div>', 'status' => $true, 'sort' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Không gian Spa', 'alias' => 'khong-gian', 'content' => '<h2>Thư giãn tuyệt đối</h2>', 'status' => $true, 'sort' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 5. Nav Links
        $db->table('nav_links')->insert([
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Bảng giá', 'url' => '/services', 'icon' => 'List', 'sort_order' => 2, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Đội ngũ', 'url' => '/staff', 'icon' => 'Users', 'sort_order' => 3, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Đặt lịch', 'url' => '/booking', 'icon' => 'Calendar', 'sort_order' => 4, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded Nav Links\n";

        // 6. Set Storefront Layout (Homepage Block configuration)
        $db->table('system_configs')->where('group_name', 'storefront_layout')->where('key', 'layout_sections')->delete();
        $db->table('system_configs')->insert([
            'group_name' => 'storefront_layout',
            'key' => 'layout_sections',
            'value' => json_encode([
                ["type" => "banner", "enabled" => true, "order" => 0, "params" => ["autoplay" => true, "interval" => 5000, "height" => "md"]],
                ["type" => "salon_services", "enabled" => true, "order" => 1, "params" => ["title" => "Dịch Vụ Spa & Salon", "subtitle" => "Thư giãn và làm mới bản thân", "count" => 6]],
                ["type" => "cms_pages", "enabled" => true, "order" => 2, "params" => ["layout" => "grid", "maxPages" => 6]],
                ["type" => "trust_badges", "enabled" => true, "order" => 3, "params" => []]
            ]),
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "✅ Seeded Homepage Layout\n";
    }
}
