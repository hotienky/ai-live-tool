<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PharmacityDataSeeder extends Seeder
{
    public function run()
    {
        $tenantId = 'longchauphar';
        $dbName = 'tenant_' . $tenantId;

        try {
            // Properly initialize the tenant context so the 'tenant' connection is fully populated
            $tenant = \App\Models\Tenant::where('id', $tenantId)->first();
            if ($tenant) {
                tenancy()->initialize($tenant);
            } else {
                // Fallback direct config if Tenancy is missing
                $config = config('database.connections.pgsql');
                $config['database'] = $dbName;
                config(['database.connections.tenant' => $config]);
            }
            DB::purge('tenant');
            DB::reconnect('tenant');

            // 1. Update Categories
            $pharmacyCategories = [
                ['name' => 'Sức khỏe sinh sản', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065941-0-17.png'],
                ['name' => 'Mắt', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065940-0-14.png'],
                ['name' => 'Tai - Mũi - Họng', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065941-0-13.png'],
                ['name' => 'Hô hấp', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065940-0-1.png'],
                ['name' => 'Thuốc trị ký sinh trùng', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240920031659-0-22.png'],
                ['name' => 'Tâm thần', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065940-0-9.png'],
                ['name' => 'Cơ - Xương - Khớp', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065941-0-11.png'],
                ['name' => 'Ung thư', 'icon' => 'https://prod-cdn.pharmacity.io/e-com/images/ecommerce/20240919065941-0-19.png'],
            ];

            $categories = DB::connection('tenant')->table('product_categories')->get();
            foreach ($categories as $index => $category) {
                $newData = $pharmacyCategories[$index % count($pharmacyCategories)];
                DB::connection('tenant')->table('product_categories')
                    ->where('id', $category->id)
                    ->update([
                        'name' => $newData['name'],
                        'slug' => Str::slug($newData['name']),
                        'image' => $newData['icon']
                    ]);
            }

            // 2. Update Products
            $pharmacyProducts = [
                ['name' => 'Thực phẩm bảo vệ sức khỏe Vitatree Cell Restore', 'image' => 'https://production-cdn.pharmacity.io/digital/300x300/plain/e-com/images/products/vitatree-cell-restore-60-vien.png', 'price' => 250000],
                ['name' => 'Bao Cao Su Durex 001 Siêu Mỏng', 'image' => 'https://production-cdn.pharmacity.io/digital/300x300/plain/e-com/images/products/durex-bcs-001-water-based-polyurethane-hop-3-cai.png', 'price' => 125000],
                ['name' => 'Yến Chưng Bestnest Hội An', 'image' => 'https://production-cdn.pharmacity.io/digital/300x300/plain/e-com/images/products/bestnest-hoi-an-yen-chung-duong-an-kieng-loc-6-hu-x70ml.png', 'price' => 380000],
                ['name' => 'Kem Đánh Răng COLGATE Ngừa Ê Buốt', 'image' => 'https://production-cdn.pharmacity.io/digital/300x300/plain/e-com/images/products/kem-danh-rang-colgate-sensitive-pro-relief-110g.png', 'price' => 45000],
                ['name' => 'Bảo vệ sức khỏe Faroson Glutamax 1000', 'image' => 'https://production-cdn.pharmacity.io/digital/300x300/plain/e-com/images/products/faroson-glutamax-1000-bao-ve-suc-khoe-hop-30-vien.png', 'price' => 950000],
            ];

            $products = DB::connection('tenant')->table('products')->get();
            foreach ($products as $index => $product) {
                $newData = $pharmacyProducts[$index % count($pharmacyProducts)];
                DB::connection('tenant')->table('products')
                    ->where('id', $product->id)
                    ->update([
                        'name' => $newData['name'],
                        'slug' => Str::slug($newData['name']) . '-' . $product->id,
                        'description' => 'Sản phẩm chăm sóc sức khỏe chính hãng được phân phối tại Pharmacity. ' . $newData['name'],
                        'price' => $newData['price'],
                        'images' => json_encode([$newData['image']]),
                        'brand_id' => null,
                    ]);
            }



            $this->command->info("Successfully seeded pharmacy images and categories to tenant_shop!");
        } catch (\Exception $e) {
            $this->command->error("Seeding failed: " . $e->getMessage());
        }
    }
}
