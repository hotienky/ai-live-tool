<?php
/**
 * Multi-Tenant Provisioning Script — v2
 * No explicit id, let DB auto-increment
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

$tenants = [
    ['slug' => 'blog',       'name' => 'TechBlog Việt Nam',           'email' => 'admin@blog.com'],
    ['slug' => 'shop',       'name' => 'Fashion Store',               'email' => 'admin@shop.com'],
    ['slug' => 'event',      'name' => 'VN Events Hub',               'email' => 'admin@event.com'],
    ['slug' => 'service',    'name' => 'BookPro - Đặt Lịch Online',   'email' => 'admin@service.com'],
    ['slug' => 'bds',        'name' => 'Golden Land Bất Động Sản',    'email' => 'admin@bds.com'],
    ['slug' => 'restaurant', 'name' => 'Nhà Hàng Phố Cổ',            'email' => 'admin@restaurant.com'],
    ['slug' => 'spa',        'name' => 'Luxury Spa & Salon',          'email' => 'admin@spa.com'],
];

echo "═══════════════════════════════════════\n";
echo "   CREATING 7 TENANT WEBSITES\n";
echo "═══════════════════════════════════════\n\n";

$created = [];

foreach ($tenants as $t) {
    $slug = $t['slug'];
    $name = $t['name'];
    $email = $t['email'];

    echo "──── [{$slug}] {$name} ────\n";

    // Check if tenant already exists
    $existing = \App\Models\Tenant::where('slug', $slug)->first();
    if ($existing) {
        echo "  ⚠️  Tenant '{$slug}' already exists (id={$existing->id})\n";
        $created[] = $slug;
        continue;
    }

    try {
        // Use the repository/insert approach like TenantsController
        $data = [
            'slug' => $slug,
            'name' => $name,
            'db_name' => "tenant_{$slug}",
            'status' => 'active',
            'plan' => 'free',
            'owner_email' => $email,
            'owner_name' => 'Admin',
            'features' => 'all',
            'data' => json_encode([
                'default_language' => 'vi',
                'storage_driver' => 'local',
                'owner_email' => $email,
                'owner_name' => 'Admin',
                'features' => 'all',
            ]),
        ];

        // Insert directly to bypass Stancl's string id requirement
        $id = DB::connection('master')->table('tenants')->insertGetId($data);
        echo "  ✅ Tenant created (id={$id})\n";

        // Now load the tenant model to run migrations
        $tenant = \App\Models\Tenant::find($id);
        if (!$tenant) {
            echo "  ❌ Could not load tenant after insert\n";
            continue;
        }

        // Run migrations
        try {
            Artisan::call('tenants:migrate', ['--tenants' => [$tenant->id], '--force' => true]);
            echo "  ✅ Migrations completed\n";
        } catch (\Exception $e) {
            echo "  ❌ Migration error: " . substr($e->getMessage(), 0, 200) . "\n";
        }

        // Seed base data
        try {
            $tenant->run(function () {
                $seeder = new \Database\Seeders\TenantBaseSeeder();
                $seeder->run();
            });
            echo "  ✅ Base data seeded\n";
        } catch (\Exception $e) {
            echo "  ❌ Seed error: " . substr($e->getMessage(), 0, 200) . "\n";
        }

        $created[] = $slug;
    } catch (\Exception $e) {
        echo "  ❌ Error: " . substr($e->getMessage(), 0, 300) . "\n";
    }
    echo "\n";
}

echo "\n═══════════════════════════════════════\n";
echo "   SUMMARY\n";
echo "═══════════════════════════════════════\n";
echo "Created: " . count($created) . "/7\n";
foreach ($created as $s) echo "  ✅ {$s}.localhost / {$s}.cms.localhost\n";

$failed = array_diff(array_column($tenants, 'slug'), $created);
foreach ($failed as $s) echo "  ❌ {$s}\n";
