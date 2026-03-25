<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Register all typical tenant databases in the master DB.
 * 
 * Handles BOTH environments:
 * - Local dev (SQLite): Creates SQLite database files for each tenant, id = slug (string)
 * - Deployed (PostgreSQL): id is auto-increment integer, slug is separate column
 * 
 * Also registers module subscriptions for each tenant.
 * 
 * Usage: php artisan db:seed --class=RegisterMissingTenantsSeeder --force
 */
class RegisterMissingTenantsSeeder extends Seeder
{
    public function run(): void
    {
        $master = DB::connection('master');
        $masterDriver = $master->getDriverName();
        $isSqlite = $masterDriver === 'sqlite';

        $this->command->info("🔧 Setting up tenants (master driver: {$masterDriver})...");

        // Map: slug → { name, modules[] }
        $tenantDefs = [
            'blog' => [
                'name' => 'Blog Platform',
                'modules' => ['blog', 'cms', 'banners', 'languages'],
            ],
            'restaurant' => [
                'name' => 'Restaurant',
                'modules' => ['restaurant', 'cms', 'banners', 'languages', 'booking'],
            ],
            'event' => [
                'name' => 'Events Platform',
                'modules' => ['events', 'cms', 'banners', 'languages', 'lucky-draw'],
            ],
            'bds' => [
                'name' => 'Real Estate',
                'modules' => ['realestate', 'cms', 'banners', 'languages'],
            ],
            'service' => [
                'name' => 'Booking Service',
                'modules' => ['booking', 'cms', 'banners', 'languages'],
            ],
            'spa' => [
                'name' => 'Spa & Wellness',
                'modules' => ['salon', 'booking', 'cms', 'banners', 'languages'],
            ],
            'ecommerce' => [
                'name' => 'E-commerce Store',
                'modules' => ['ecom', 'cms', 'banners', 'languages', 'marketing', 'shipping', 'warehouse', 'tax', 'accounting'],
            ],
        ];

        foreach ($tenantDefs as $slug => $def) {
            $dbName = $isSqlite ? "tenant_{$slug}.sqlite" : "tenant_{$slug}";

            // Check if already exists by slug or db_name
            $existing = $master->table('tenants')
                ->where('slug', $slug)
                ->orWhere('db_name', $dbName)
                ->first();

            if ($existing) {
                $this->command->info("  ⏭  '{$slug}' already exists (id={$existing->id}), updating modules only.");
                $this->registerModules($master, $existing->id, $def['modules']);
                continue;
            }

            // For SQLite: create the database file if it doesn't exist
            if ($isSqlite) {
                $dbPath = database_path($dbName);
                if (!file_exists($dbPath)) {
                    touch($dbPath);
                    $this->command->info("  📄 Created SQLite file: {$dbName}");
                }
            }

            // Build insert record — include all NOT NULL columns for PG
            $record = [
                'slug' => $slug,
                'name' => $def['name'],
                'db_name' => $dbName,
                'status' => 'active',
                'plan' => 'pro',
                'owner_email' => "admin@{$slug}.cms.localhost",
                'owner_name' => $def['name'] . ' Admin',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if ($isSqlite) {
                // SQLite: id is string (slug-based)
                $record['id'] = $slug;
                $master->table('tenants')->insert($record);
                $tenantId = $slug;
            } else {
                // PG: id is auto-increment integer
                $tenantId = $master->table('tenants')->insertGetId($record);
            }

            $this->command->info("  ✅ Created tenant: {$slug} → {$dbName} (id={$tenantId})");

            // Register modules with the actual tenant ID
            $this->registerModules($master, $tenantId, $def['modules']);
        }

        $this->command->info("\n✅ Done! Now run: php artisan tenants:migrate --force");
        $this->command->info("   Then: php artisan db:seed --class=RepairModuleMigrationsSeeder --force");
    }

    protected function registerModules($master, $tenantId, array $modules): void
    {
        foreach ($modules as $moduleId) {
            $exists = $master->table('tenant_module_subscriptions')
                ->where('tenant_id', $tenantId)
                ->where('module_id', $moduleId)
                ->exists();

            if ($exists) continue;

            $master->table('tenant_module_subscriptions')->insert([
                'tenant_id' => $tenantId,
                'module_id' => $moduleId,
                'is_active' => true,
                'status' => 'active',
                'installed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $this->command->info("    📦 Modules: " . implode(', ', $modules));
    }
}
