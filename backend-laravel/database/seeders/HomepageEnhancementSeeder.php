<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Seeds banners, store branding, and enriched homepage layouts for all 7 tenants.
 * Run: php artisan db:seed --class=HomepageEnhancementSeeder
 */
class HomepageEnhancementSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            'tenant_shop' => [
                'name' => 'Fashion Store',
                'desc' => 'Thời trang cao cấp — Phong cách riêng của bạn',
                'banner_img' => 'hero_shop.png',
                'banner_title' => 'Bộ Sưu Tập Mới 2026',
                'banner_desc' => 'Khám phá xu hướng thời trang mới nhất với ưu đãi lên đến 30%',
                'banner_link' => '/products',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 5000, 'height' => 'lg']],
                    ['type' => 'categories', 'enabled' => true, 'order' => 1, 'params' => ['columns' => 6, 'showDescription' => false, 'layoutStyle' => 'grid']],
                    ['type' => 'flash_sale', 'enabled' => true, 'order' => 2, 'params' => ['showTimer' => true, 'showProgress' => true, 'count' => 8]],
                    ['type' => 'featured_products', 'enabled' => true, 'order' => 3, 'params' => ['title' => 'Sản Phẩm Nổi Bật', 'count' => 8, 'columns' => 4]],
                    ['type' => 'new_arrivals', 'enabled' => true, 'order' => 4, 'params' => ['title' => 'Hàng Mới Về', 'count' => 8, 'columns' => 4]],
                    ['type' => 'testimonials', 'enabled' => true, 'order' => 5, 'params' => ['title' => 'Khách Hàng Nói Gì', 'subtitle' => 'Hàng nghìn khách hàng tin tưởng lựa chọn']],
                    ['type' => 'brands_slider', 'enabled' => true, 'order' => 6, 'params' => ['title' => 'Thương Hiệu Đối Tác']],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 7, 'params' => ['title' => 'Đăng Ký Nhận Tin', 'subtitle' => 'Nhận ưu đãi độc quyền và thông tin sản phẩm mới', 'buttonText' => 'Đăng ký ngay']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 8, 'params' => ['layout' => 'grid', 'maxPages' => 6]],
                ],
            ],
            'tenant_blog' => [
                'name' => 'Blog Sáng Tạo',
                'desc' => 'Nơi chia sẻ kiến thức và cảm hứng sống',
                'banner_img' => 'hero_blog.png',
                'banner_title' => 'Khám Phá Câu Chuyện',
                'banner_desc' => 'Bài viết chất lượng về công nghệ, cuộc sống và sáng tạo',
                'banner_link' => '/blog',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 6000, 'height' => 'lg']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 1, 'params' => ['layout' => 'grid', 'maxPages' => 12, 'title' => 'Bài Viết Mới Nhất']],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 2, 'params' => ['title' => 'Đăng Ký Nhận Bài Viết Mới', 'subtitle' => 'Không bỏ lỡ bài viết nào — gửi thẳng vào email bạn', 'buttonText' => 'Đăng ký']],
                ],
            ],
            'tenant_restaurant' => [
                'name' => 'Nhà Hàng Việt',
                'desc' => 'Hương vị Việt Nam đích thực — Ẩm thực tinh tế',
                'banner_img' => 'hero_restaurant.png',
                'banner_title' => 'Hương Vị Việt Nam',
                'banner_desc' => 'Trải nghiệm ẩm thực đỉnh cao với nguyên liệu tươi ngon nhất',
                'banner_link' => '/menu',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 5000, 'height' => 'lg']],
                    ['type' => 'restaurant_menu', 'enabled' => true, 'order' => 1, 'params' => ['title' => 'Thực Đơn Đặc Sắc', 'subtitle' => 'Món ăn được chế biến từ nguyên liệu tươi ngon mỗi ngày']],
                    ['type' => 'testimonials', 'enabled' => true, 'order' => 2, 'params' => ['title' => 'Thực Khách Đánh Giá', 'subtitle' => 'Hàng nghìn thực khách hài lòng']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 3, 'params' => ['layout' => 'grid', 'maxPages' => 4]],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 4, 'params' => ['title' => 'Nhận Menu Mới', 'subtitle' => 'Đăng ký để nhận thông tin khuyến mãi và thực đơn mới', 'buttonText' => 'Đăng ký']],
                ],
            ],
            'tenant_service' => [
                'name' => 'Dịch Vụ Pro',
                'desc' => 'Đặt lịch dịch vụ chuyên nghiệp — Nhanh chóng & Tin cậy',
                'banner_img' => 'hero_service.png',
                'banner_title' => 'Đặt Lịch Hẹn Ngay',
                'banner_desc' => 'Dịch vụ chuyên nghiệp tại nhà — Tiện lợi & Tin cậy',
                'banner_link' => '/booking',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 5000, 'height' => 'lg']],
                    ['type' => 'booking_services', 'enabled' => true, 'order' => 1, 'params' => ['title' => 'Dịch Vụ Nổi Bật', 'subtitle' => 'Chọn dịch vụ phù hợp và đặt lịch ngay hôm nay', 'count' => 6]],
                    ['type' => 'testimonials', 'enabled' => true, 'order' => 2, 'params' => ['title' => 'Khách Hàng Nói Gì', 'subtitle' => 'Hơn 5,000 khách hàng tin tưởng sử dụng']],
                    ['type' => 'faq', 'enabled' => true, 'order' => 3, 'params' => ['title' => 'Câu Hỏi Thường Gặp']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 4, 'params' => ['layout' => 'grid', 'maxPages' => 6]],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 5, 'params' => ['title' => 'Nhận Ưu Đãi', 'subtitle' => 'Đăng ký để nhận mã giảm giá dịch vụ', 'buttonText' => 'Đăng ký']],
                ],
            ],
            'tenant_spa' => [
                'name' => 'Luxe Spa & Beauty',
                'desc' => 'Thư giãn & Làm đẹp — Trải nghiệm spa đẳng cấp',
                'banner_img' => 'hero_spa.png',
                'banner_title' => 'Thư Giãn & Làm Đẹp',
                'banner_desc' => 'Trải nghiệm dịch vụ spa cao cấp với đội ngũ chuyên gia hàng đầu',
                'banner_link' => '/booking',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 6000, 'height' => 'lg']],
                    ['type' => 'salon_services', 'enabled' => true, 'order' => 1, 'params' => ['title' => 'Dịch Vụ Spa & Salon', 'subtitle' => 'Chăm sóc toàn diện — Từ da mặt đến body', 'count' => 6]],
                    ['type' => 'testimonials', 'enabled' => true, 'order' => 2, 'params' => ['title' => 'Khách Hàng Yêu Thích', 'subtitle' => 'Được hàng nghìn khách hàng tin tưởng']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 3, 'params' => ['layout' => 'grid', 'maxPages' => 6]],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 4, 'params' => ['title' => 'Ưu Đãi Đặc Biệt', 'subtitle' => 'Đăng ký nhận voucher giảm giá dịch vụ', 'buttonText' => 'Đăng ký']],
                ],
            ],
            'tenant_bds' => [
                'name' => 'BĐS Việt',
                'desc' => 'Tìm ngôi nhà mơ ước — Bất động sản uy tín',
                'banner_img' => 'hero_bds.png',
                'banner_title' => 'Tìm Ngôi Nhà Mơ Ước',
                'banner_desc' => 'Khám phá bất động sản hạng sang tại Việt Nam',
                'banner_link' => '/listings',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 6000, 'height' => 'lg']],
                    ['type' => 'property_listings', 'enabled' => true, 'order' => 1, 'params' => ['title' => 'Bất Động Sản Nổi Bật', 'subtitle' => 'Dự án hot nhất hiện nay', 'count' => 6]],
                    ['type' => 'testimonials', 'enabled' => true, 'order' => 2, 'params' => ['title' => 'Phản Hồi Khách Hàng', 'subtitle' => 'Hơn 1,000 giao dịch thành công']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 3, 'params' => ['layout' => 'grid', 'maxPages' => 6]],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 4, 'params' => ['title' => 'Nhận Tin BĐS', 'subtitle' => 'Cập nhật giá và dự án mới nhất', 'buttonText' => 'Đăng ký']],
                ],
            ],
            'tenant_event' => [
                'name' => 'Sự Kiện Việt',
                'desc' => 'Khám phá sự kiện hấp dẫn — Trải nghiệm đáng nhớ',
                'banner_img' => 'hero_events.png',
                'banner_title' => 'Sự Kiện Nổi Bật',
                'banner_desc' => 'Đừng bỏ lỡ những trải nghiệm tuyệt vời nhất năm 2026',
                'banner_link' => '/events',
                'layout' => [
                    ['type' => 'banner', 'enabled' => true, 'order' => 0, 'params' => ['autoplay' => true, 'interval' => 5000, 'height' => 'lg']],
                    ['type' => 'upcoming_events', 'enabled' => true, 'order' => 1, 'params' => ['title' => 'Sự Kiện Sắp Tới', 'subtitle' => 'Đừng bỏ lỡ những trải nghiệm tuyệt vời', 'count' => 6]],
                    ['type' => 'testimonials', 'enabled' => true, 'order' => 2, 'params' => ['title' => 'Người Tham Gia Đánh Giá', 'subtitle' => 'Hàng nghìn người đã tham gia và hài lòng']],
                    ['type' => 'cms_pages', 'enabled' => true, 'order' => 3, 'params' => ['layout' => 'grid', 'maxPages' => 6]],
                    ['type' => 'newsletter', 'enabled' => true, 'order' => 4, 'params' => ['title' => 'Đăng Ký Nhận Thông Báo', 'subtitle' => 'Sự kiện mới sẽ được gửi đến email bạn', 'buttonText' => 'Đăng ký']],
                ],
            ],
        ];

        foreach ($tenants as $dbName => $config) {
            echo "🔧 Setting up {$dbName}..." . PHP_EOL;

            Config::set('database.connections.pgsql.database', $dbName);
            DB::purge('pgsql');
            $db = DB::connection('pgsql');

            try {
                // 1. Copy banner image to tenant storage
                $mediaDir = "tenants/{$dbName}/banners";
                Storage::disk('public')->makeDirectory($mediaDir);
                $src = storage_path("app/seeds/banners/{$config['banner_img']}");
                $dest = Storage::disk('public')->path("{$mediaDir}/{$config['banner_img']}");
                if (file_exists($src)) {
                    copy($src, $dest);
                }
                $bannerUrl = "/storage/{$mediaDir}/{$config['banner_img']}";

                // 2. Seed banner
                $db->table('banners')->truncate();
                $db->table('banners')->insert([
                    'title' => $config['banner_title'],
                    'description' => $config['banner_desc'],
                    'image' => $bannerUrl,
                    'url' => $config['banner_link'],
                    'link' => $config['banner_link'],
                    'sort_order' => 0,
                    'sort' => 0,
                    'status' => true,
                    'is_active' => true,
                    'position' => 'homepage',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                echo "  ✅ Banner seeded" . PHP_EOL;

                // 3. Update store branding
                $db->table('system_configs')->where('group_name', 'store')->whereIn('key', ['store_name', 'store_description', 'store_tagline'])->delete();
                $storeInfo = [
                    ['group_name' => 'store', 'key' => 'store_name', 'value' => $config['name'], 'created_at' => now(), 'updated_at' => now()],
                    ['group_name' => 'store', 'key' => 'store_description', 'value' => $config['desc'], 'created_at' => now(), 'updated_at' => now()],
                    ['group_name' => 'store', 'key' => 'store_tagline', 'value' => $config['desc'], 'created_at' => now(), 'updated_at' => now()],
                ];
                $db->table('system_configs')->insert($storeInfo);
                echo "  ✅ Store branding set: {$config['name']}" . PHP_EOL;

                // 4. Update layout sections (richer config)
                $db->table('system_configs')
                    ->where('group_name', 'storefront_layout')
                    ->where('key', 'layout_sections')
                    ->delete();
                $db->table('system_configs')->insert([
                    'group_name' => 'storefront_layout',
                    'key' => 'layout_sections',
                    'value' => json_encode($config['layout']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                echo "  ✅ Layout updated (" . count($config['layout']) . " sections)" . PHP_EOL;

            } catch (\Exception $e) {
                echo "  ❌ Error: " . $e->getMessage() . PHP_EOL;
            }
        }

        // Flush cache
        \Illuminate\Support\Facades\Cache::flush();
        echo PHP_EOL . "🎉 All 7 tenants enhanced!" . PHP_EOL;
    }
}
