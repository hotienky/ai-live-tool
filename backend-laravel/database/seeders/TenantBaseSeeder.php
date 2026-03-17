<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * TenantBaseSeeder — Seeds essential data for every new tenant.
 *
 * Auto-runs during tenant creation pipeline. Seeds:
 * - Default admin user (from owner_email)
 * - Roles & Permissions
 * - Default languages (vi, en)
 * - System configs
 * - Default nav links
 */
class TenantBaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = tenant();
        if (!$tenant) {
            echo "⚠️  No active tenant context, skipping.\n";
            return;
        }

        $db = DB::connection('tenant');

        echo "🌱 Seeding essential data for tenant: {$tenant->slug}\n";

        // ── 1. Roles (create first so admin user can link to super_admin) ──
        $superAdminRoleId = null;
        if ($db->table('roles')->count() < 1) {
            $superAdminRoleId = $db->table('roles')->insertGetId([
                'name' => 'super_admin', 'display_name' => 'Super Admin',
                'permissions' => json_encode(['*']),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $db->table('roles')->insert([
                ['name' => 'manager', 'display_name' => 'Quản lý', 'permissions' => json_encode(['products.*', 'orders.*', 'customers.*', 'cms.*', 'banners.*', 'settings.*']), 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'editor', 'display_name' => 'Biên tập viên', 'permissions' => json_encode(['products.view', 'products.edit', 'cms.*', 'banners.*']), 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'viewer', 'display_name' => 'Chỉ xem', 'permissions' => json_encode(['*.view']), 'created_at' => now(), 'updated_at' => now()],
            ]);
            echo "   ✅ Roles created (4)\n";
        } else {
            $superAdminRoleId = $db->table('roles')->where('name', 'super_admin')->value('id');
        }

        // ── 2. Admin User (linked to super_admin role) ──
        if ($db->table('users')->count() < 1) {
            $userId = $db->table('users')->insertGetId([
                'name' => $tenant->owner_name ?? 'Admin',
                'email' => $tenant->owner_email ?? "admin@{$tenant->slug}.com",
                'password' => Hash::make('password'),
                'role' => 'admin',
                'role_id' => $superAdminRoleId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Also create user_roles pivot entry
            if ($superAdminRoleId && $db->getSchemaBuilder()->hasTable('user_roles')) {
                $db->table('user_roles')->insert([
                    'user_id' => $userId,
                    'role_id' => $superAdminRoleId,
                ]);
            }
            echo "   ✅ Admin user created (linked to super_admin role)\n";
        }

        // ── 3. Languages ──
        if ($db->table('languages')->count() < 1) {
            $db->table('languages')->insert([
                ['code' => 'vi', 'name' => 'Tiếng Việt', 'is_default' => true, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['code' => 'en', 'name' => 'English', 'is_default' => false, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
            echo "   ✅ Languages created (vi, en)\n";
        }

        // ── 4. System Configs ──
        $configs = [
            ['key' => 'store_name', 'value' => $tenant->name ?? 'My Store', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'store_email', 'value' => $tenant->owner_email ?? '', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'currency', 'value' => 'VND', 'type' => 'string', 'group_name' => 'store'],
            ['key' => 'free_shipping_min', 'value' => '300000', 'type' => 'number', 'group_name' => 'store'],
        ];
        foreach ($configs as $cfg) {
            if (!$db->table('system_configs')->where('key', $cfg['key'])->exists()) {
                $cfg['created_at'] = $cfg['updated_at'] = now();
                $db->table('system_configs')->insert($cfg);
            }
        }
        echo "   ✅ System configs created\n";

        // ── 5. Default Nav Links ──
        if ($db->table('nav_links')->count() < 1) {
            $db->table('nav_links')->insert([
                ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Sản phẩm', 'url' => '/products', 'icon' => 'Package', 'sort' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
            echo "   ✅ Nav links created\n";
        }

        echo "✅ Tenant base seeding complete!\n";
    }
}
