<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PharmacityRawSeeder extends Seeder
{
    public function run()
    {
        // Force the connection config in case .env doesn't map it properly for artisan
        config([
            'database.connections.master' => [
                'driver' => 'pgsql',
                'host' => 'postgres',
                'port' => '5432',
                'database' => 'master_db',
                'username' => 'postgres',
                'password' => 'postgres',
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
            ]
        ]);

        try {
            DB::purge('master');
            $id = DB::connection('master')->table('tenants')->where('slug', 'longchauphar')->value('id');
            
            if (!$id) {
                $this->command->error("Tenant 'longchauphar' not found in master_db.tenants.");
                return;
            }

            $layoutData = [
                [
                    "id" => uniqid('sect_'),
                    "type" => "banner",
                    "params" => ["autoplay" => true, "interval" => 4000, "height" => "lg"],
                    "content" => [
                        ["image" => "https://production-cdn.pharmacity.io/digital/1590x0/plain/e-com/images/banners/20260323021629-0-Slidebanner_Desktop.png?versionId=YQlAy0pCh_NdCQ8VQtT4mefBCSsIInlw", "link" => "#", "title" => "Cùng nàng trên mọi hành trình", "caption" => ""],
                        ["image" => "https://production-cdn.pharmacity.io/digital/1590x0/plain/e-com/images/banners/20260302094351-0-thangcuanang-web.png?versionId=7bvC5unhTm_7buNnzOlIqwne1QziUShG", "link" => "#", "title" => "Tháng của nàng - Deal rạng rỡ", "caption" => ""],
                        ["image" => "https://production-cdn.pharmacity.io/digital/1590x0/plain/e-com/images/banners/20260228140708-0-online-slide-web.png?versionId=FFF7hgDOYCuV2gkkaWdboPozemieHAgM", "link" => "#", "title" => "Ưu đãi Online Slide", "caption" => ""]
                    ]
                ],
                [
                    "id" => uniqid('sect_'),
                    "type" => "feature_links",
                    "params" => ["columns" => 4, "style" => "card", "fullWidth" => false],
                    "content" => [
                        ["title" => "Tư vấn mua thuốc", "subtitle" => "", "icon" => "https://cdn-icons-png.flaticon.com/512/3004/3004381.png", "url" => "#", "bgColor" => "#fdf2f8"],
                        ["title" => "Liên hệ Dược sĩ", "subtitle" => "", "icon" => "https://cdn-icons-png.flaticon.com/512/3008/3008432.png", "url" => "#", "bgColor" => "#eff6ff"],
                        ["title" => "Hệ thống nhà thuốc", "subtitle" => "", "icon" => "https://cdn-icons-png.flaticon.com/512/4320/4320350.png", "url" => "#", "bgColor" => "#f0fdf4"],
                        ["title" => "Kiểm tra sức khỏe", "subtitle" => "Miễn phí", "icon" => "https://cdn-icons-png.flaticon.com/512/2966/2966327.png", "url" => "#", "bgColor" => "#fefce8"]
                    ]
                ],
                ["id" => uniqid('sect_'), "type" => "categories", "params" => ["title" => "Danh mục sản phẩm", "columns" => 8, "showDescription" => false, "layoutStyle" => "circle_icon", "showCount" => false]],
                ["id" => uniqid('sect_'), "type" => "image_banner", "params" => ["desktopImage" => "https://production-cdn.pharmacity.io/digital/1590x0/plain/e-com/images/banners/20260323021629-0-Slidebanner_Desktop.png?versionId=YQlAy0pCh_NdCQ8VQtT4mefBCSsIInlw", "link" => "#", "fullWidth" => false]],
                ["id" => uniqid('sect_'), "type" => "flash_sale", "params" => ["theme" => "orange_strip", "showTimer" => true, "showProgress" => true, "count" => 5, "columns" => 5]],
                ["id" => uniqid('sect_'), "type" => "featured_products", "params" => ["title" => "Mua 2 giá tốt bất ngờ", "layoutStyle" => "carousel", "count" => 8, "slidesPerView" => 4, "columns" => 4, "sortOrder" => "bestselling"]],
                ["id" => uniqid('sect_'), "type" => "featured_products", "params" => ["title" => "Cần gấp có Pharmacity giao ngay", "layoutStyle" => "carousel", "count" => 8, "slidesPerView" => 4, "columns" => 4, "sortOrder" => "newest"]]
            ];

            $json = json_encode([
                'version' => '1.0',
                'blocks' => $layoutData
            ]);

            $tenant = \App\Models\Tenant::where('slug', 'longchauphar')->first() ?? \App\Models\Tenant::find($id);
            if ($tenant) {
                tenancy()->initialize($tenant);
                DB::connection('tenant')->table("cms_pages")
                    ->where('alias', 'home')
                    ->update([
                        'layout_data' => $json,
                        'is_dynamic' => true,
                        'content' => '' // Clear the incorrect content
                    ]);
                $this->command->info("Success! Pharmacity Layout configured directly into 'tenant_longchauphar.cms_pages' using 'layout_data' structure.");
            } else {
                $this->command->error("Tenant 'longchauphar' model could not be initialized.");
            }
        } catch (\Exception $e) {
            $this->command->error("DB Error: " . $e->getMessage());
        }
    }
}
