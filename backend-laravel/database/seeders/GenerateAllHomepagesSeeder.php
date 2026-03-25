<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class GenerateAllHomepagesSeeder extends Seeder
{
    public function run()
    {
        $dbs = [
            'tenant_shop', 'tenant_blog', 'tenant_bds', 
            'tenant_event', 'tenant_service', 'tenant_spa', 'tenant_restaurant'
        ];
        
        foreach ($dbs as $dbName) {
            try {
                Config::set('database.connections.pgsql.database', $dbName);
                DB::purge('pgsql');
                $db = DB::connection('pgsql');

                if (!$db->getSchemaBuilder()->hasTable('cms_pages')) {
                    continue;
                }

                $exists = $db->table('cms_pages')->where('alias', 'home')->exists();
                if (!$exists) {
                    $html = $this->getHomepageHtml($dbName);
                    
                    // Laravel schema builder uses postgres native boolean
                    $isPgsql = $db->getDriverName() === 'pgsql';
                    $true = $isPgsql ? DB::raw('true') : true;

                    $db->table('cms_pages')->insert([
                        'title' => 'Trang chủ',
                        'alias' => 'home',
                        'content' => $html,
                        'status' => $true,
                        'sort' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    echo "✅ Seeded Home page for $dbName\n";
                } else {
                    echo "ℹ️ Home page already exists in $dbName\n";
                }
            } catch (\Exception $e) {
                echo "❌ Skipped $dbName: " . $e->getMessage() . "\n";
            }
        }
    }

    private function getHomepageHtml($db)
    {
        if (str_contains($db, 'bds')) {
            return '<div style="background: linear-gradient(135deg, var(--sf-accent) 0%, #1e3a8a 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Tìm kiếm Bất Động Sản Hoàn Hảo</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Nền tảng mua bán và cho thuê nhà đất uy tín, cập nhật các dự án mới nhất mỗi ngày.</p>
                <a href="/listings" class="btn btn--primary" style="background: white; color: var(--sf-accent); padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Khám Phá Dự Án</a>
            </div>';
        }
        if (str_contains($db, 'event')) {
            return '<div style="background: linear-gradient(135deg, #f43f5e 0%, #9f1239 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Khám Phá Sự Kiện Tuyệt Vời</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Tham gia cộng đồng của chúng tôi và trải nghiệm những hoạt động không thể bỏ lỡ.</p>
                <a href="/events" class="btn btn--primary" style="background: white; color: #e11d48; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Xem Lịch Sự Kiện</a>
            </div>';
        }
        if (str_contains($db, 'spa')) {
            return '<div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Tái Tạo Năng Lượng Tâm Hồn</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Các liệu trình chăm sóc nhan sắc và phục hồi sức khỏe được thực hiện bởi chuyên gia hàng đầu.</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="/services" class="btn btn--primary" style="background: white; color: #db2777; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Xem Bảng Giá</a>
                    <a href="/booking" class="btn btn--outline" style="border-color: white; color: white; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Đặt Lịch Hẹn</a>
                </div>
            </div>';
        }
        if (str_contains($db, 'restaurant')) {
            return '<div style="background: linear-gradient(135deg, #d97706 0%, #92400e 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Hương Vị Tinh Hoa Ẩm Thực</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Tận hưởng không gian sang trọng cùng những món ăn đặc sắc được chuẩn bị tỉ mỉ.</p>
                <a href="/reservations" class="btn btn--primary" style="background: white; color: #b45309; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Đặt Bàn Ngay</a>
            </div>';
        }
        if (str_contains($db, 'service')) {
            return '<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; border-radius: 24px; padding: 60px 40px; text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <h1 style="font-size:42px; font-weight: 700; margin-bottom:20px;">Dịch Vụ Chuyên Nghiệp Mọi Lúc</h1>
                <p style="font-size:20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Kết nối bạn với những chuyên gia và người thợ lành nghề nhất trong mọi lĩnh vực.</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="/services" class="btn btn--primary" style="background: white; color: #0284c7; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Xem Dịch Vụ</a>
                    <a href="/booking" class="btn btn--outline" style="border-color: white; color: white; padding: 14px 32px; font-weight: 600; font-size: 16px; border-radius: 50px;">Đặt Lịch Khảo Sát</a>
                </div>
            </div>';
        }
        return '<div style="text-align: center; padding: 80px 40px; background: var(--sf-bg-surface); border-radius: 16px; margin-top: 40px; border: 1px solid var(--sf-border);">
            <h1 style="font-size:36px; margin-bottom:16px;">Chào mừng bạn đến với Cửa hàng!</h1>
            <p style="font-size:18px; color: var(--sf-text-muted);">Trang chủ này đang chờ bạn tùy chỉnh nội dung.</p>
        </div>';
    }
}
