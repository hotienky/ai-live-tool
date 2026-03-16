<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Add RBAC tables: permissions, role_permissions, user_roles
 * Also adds role_id to users table if missing.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Permissions ──
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('module');         // e.g. 'products', 'orders'
                $table->string('name')->unique(); // e.g. 'products.view'
                $table->string('display_name');   // e.g. 'Xem sản phẩm'
                $table->string('description')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        // ── Role–Permission pivot ──
        if (!Schema::hasTable('role_permissions')) {
            Schema::create('role_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->unsignedBigInteger('permission_id');
                $table->primary(['role_id', 'permission_id']);

                $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
                $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            });
        }

        // ── User–Role pivot ──
        if (!Schema::hasTable('user_roles')) {
            Schema::create('user_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('role_id');
                $table->primary(['user_id', 'role_id']);

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            });
        }

        // ── Add role_id to users if missing ──
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id')->nullable()->after('role');
                $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
            });
        }

        // ── Seed default permissions ──
        $this->seedPermissions();

        // ── Seed default roles ──
        $this->seedRoles();
    }

    private function seedPermissions(): void
    {
        $modules = [
            'products' => [
                ['name' => 'products.view',   'display_name' => 'Xem sản phẩm'],
                ['name' => 'products.create', 'display_name' => 'Tạo sản phẩm'],
                ['name' => 'products.edit',   'display_name' => 'Sửa sản phẩm'],
                ['name' => 'products.delete', 'display_name' => 'Xóa sản phẩm'],
            ],
            'orders' => [
                ['name' => 'orders.view',   'display_name' => 'Xem đơn hàng'],
                ['name' => 'orders.create', 'display_name' => 'Tạo đơn hàng'],
                ['name' => 'orders.edit',   'display_name' => 'Sửa đơn hàng'],
                ['name' => 'orders.delete', 'display_name' => 'Xóa đơn hàng'],
                ['name' => 'orders.export', 'display_name' => 'Xuất đơn hàng'],
            ],
            'customers' => [
                ['name' => 'customers.view',   'display_name' => 'Xem khách hàng'],
                ['name' => 'customers.edit',   'display_name' => 'Sửa khách hàng'],
                ['name' => 'customers.delete', 'display_name' => 'Xóa khách hàng'],
            ],
            'cms' => [
                ['name' => 'cms.view',   'display_name' => 'Xem trang CMS'],
                ['name' => 'cms.create', 'display_name' => 'Tạo trang CMS'],
                ['name' => 'cms.edit',   'display_name' => 'Sửa trang CMS'],
                ['name' => 'cms.delete', 'display_name' => 'Xóa trang CMS'],
            ],
            'banners' => [
                ['name' => 'banners.view',   'display_name' => 'Xem banner'],
                ['name' => 'banners.create', 'display_name' => 'Tạo banner'],
                ['name' => 'banners.edit',   'display_name' => 'Sửa banner'],
                ['name' => 'banners.delete', 'display_name' => 'Xóa banner'],
            ],
            'promotions' => [
                ['name' => 'promotions.view',   'display_name' => 'Xem khuyến mãi'],
                ['name' => 'promotions.create', 'display_name' => 'Tạo khuyến mãi'],
                ['name' => 'promotions.edit',   'display_name' => 'Sửa khuyến mãi'],
                ['name' => 'promotions.delete', 'display_name' => 'Xóa khuyến mãi'],
            ],
            'settings' => [
                ['name' => 'settings.view', 'display_name' => 'Xem cài đặt'],
                ['name' => 'settings.edit', 'display_name' => 'Sửa cài đặt (theme, config, nav, ngôn ngữ)'],
            ],
            'system' => [
                ['name' => 'system.roles',         'display_name' => 'Quản lý roles & phân quyền'],
                ['name' => 'system.users',         'display_name' => 'Quản lý users'],
                ['name' => 'system.api_keys',      'display_name' => 'Quản lý API keys'],
                ['name' => 'system.webhooks',      'display_name' => 'Quản lý webhooks'],
                ['name' => 'system.activity_logs', 'display_name' => 'Xem nhật ký hoạt động'],
            ],
        ];

        foreach ($modules as $module => $perms) {
            foreach ($perms as $p) {
                DB::table('permissions')->updateOrInsert(
                    ['name' => $p['name']],
                    ['module' => $module, 'display_name' => $p['display_name'], 'created_at' => now()]
                );
            }
        }
    }

    private function seedRoles(): void
    {
        $allPermIds = DB::table('permissions')->pluck('id', 'name');

        // ── Super Admin ──
        $superAdminId = DB::table('roles')->updateOrInsert(
            ['name' => 'super_admin'],
            ['display_name' => 'Super Admin', 'permissions' => json_encode(['*']), 'created_at' => now(), 'updated_at' => now()]
        );
        $superAdminId = DB::table('roles')->where('name', 'super_admin')->value('id');
        // Super admin gets ALL permissions
        foreach ($allPermIds as $pid) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $superAdminId, 'permission_id' => $pid]
            );
        }

        // ── Manager ──
        $managerId = DB::table('roles')->updateOrInsert(
            ['name' => 'manager'],
            ['display_name' => 'Quản lý', 'permissions' => json_encode([
                'products.*', 'orders.*', 'customers.*', 'cms.*', 'banners.*', 'promotions.*', 'settings.view',
            ]), 'created_at' => now(), 'updated_at' => now()]
        );
        $managerId = DB::table('roles')->where('name', 'manager')->value('id');
        $managerModules = ['products', 'orders', 'customers', 'cms', 'banners', 'promotions'];
        foreach ($allPermIds as $name => $pid) {
            $mod = explode('.', $name)[0];
            if (in_array($mod, $managerModules) || $name === 'settings.view') {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $managerId, 'permission_id' => $pid]
                );
            }
        }

        // ── Editor ──
        $editorId = DB::table('roles')->updateOrInsert(
            ['name' => 'editor'],
            ['display_name' => 'Biên tập viên', 'permissions' => json_encode([
                'products.view', 'products.edit', 'cms.*', 'banners.*', 'settings.view',
            ]), 'created_at' => now(), 'updated_at' => now()]
        );
        $editorId = DB::table('roles')->where('name', 'editor')->value('id');
        $editorPerms = ['products.view', 'products.edit', 'cms.view', 'cms.create', 'cms.edit', 'cms.delete', 'banners.view', 'banners.create', 'banners.edit', 'banners.delete', 'settings.view'];
        foreach ($editorPerms as $pName) {
            if (isset($allPermIds[$pName])) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $editorId, 'permission_id' => $allPermIds[$pName]]
                );
            }
        }

        // ── Viewer ──
        $viewerId = DB::table('roles')->updateOrInsert(
            ['name' => 'viewer'],
            ['display_name' => 'Chỉ xem', 'permissions' => json_encode(['*.view']), 'created_at' => now(), 'updated_at' => now()]
        );
        $viewerId = DB::table('roles')->where('name', 'viewer')->value('id');
        foreach ($allPermIds as $name => $pid) {
            if (str_ends_with($name, '.view')) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $viewerId, 'permission_id' => $pid]
                );
            }
        }

        // ── Assign super_admin to all existing users that have no role ──
        $usersWithoutRole = DB::table('users')->whereNull('role_id')->pluck('id');
        foreach ($usersWithoutRole as $uid) {
            DB::table('users')->where('id', $uid)->update(['role_id' => $superAdminId]);
            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $uid],
                ['role_id' => $superAdminId]
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['role_id']);
                $table->dropColumn('role_id');
            });
        }
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
    }
};
