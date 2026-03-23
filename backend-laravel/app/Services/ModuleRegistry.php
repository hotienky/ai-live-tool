<?php

namespace App\Services;

use App\Models\Module;
use App\Models\TenantModuleSubscription;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ModuleRegistry
{
    // Get all active modules from master DB
    public static function availableModules(): array
    {
        return Module::whereRaw('"is_active" = true')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->keyBy('module_id')
            ->toArray();
    }

    // Get installed module IDs for a specific tenant (cached)
    public static function installedModuleIds(string $tenantId): array
    {
        return Cache::remember("tenant_modules:{$tenantId}", 600, function () use ($tenantId) {
            return TenantModuleSubscription::where('tenant_id', $tenantId)
                ->whereRaw('"is_active" = true')
                ->pluck('module_id')
                ->toArray();
        });
    }

    // Check if a module is installed for a tenant
    public static function isInstalled(string $tenantId, string $moduleId): bool
    {
        return in_array($moduleId, self::installedModuleIds($tenantId));
    }

    // Install a module for a tenant
    public static function install(string $tenantId, string $moduleId, ?int $userId = null): array
    {
        $module = Module::where('module_id', $moduleId)->whereRaw('"is_active" = true')->first();
        if (!$module) {
            return ['success' => false, 'message' => "Module '{$moduleId}' không tồn tại hoặc đã bị tắt"];
        }

        // Check dependencies
        $requires = $module->requires ?? [];
        foreach ($requires as $dep) {
            if (!self::isInstalled($tenantId, $dep)) {
                $depModule = Module::where('module_id', $dep)->first();
                $depName = $depModule->name ?? $dep;
                return ['success' => false, 'message' => "Cần cài trước module: {$depName}"];
            }
        }

        // Check if already subscribed
        $existing = TenantModuleSubscription::where('tenant_id', $tenantId)
            ->where('module_id', $moduleId)
            ->first();

        if ($existing) {
            if ($existing->is_active) {
                return ['success' => false, 'message' => 'Module đã được cài đặt'];
            }
            // Previously approved → allow reinstall directly
            if ($existing->status === 'active') {
                $existing->update([
                    'is_active' => true,
                    'installed_at' => now(),
                    'installed_by' => $userId,
                ]);
                static::runModuleMigrations($moduleId);
                static::clearCache($tenantId);
                return ['success' => true, 'message' => "Đã cài đặt lại {$module->name}"];
            }
            // Free module → reactivate
            if ($module->price <= 0) {
                $existing->update([
                    'is_active' => true,
                    'status' => 'active',
                    'installed_at' => now(),
                    'installed_by' => $userId,
                ]);
                static::clearCache($tenantId);
                return ['success' => true, 'message' => "Đã cài đặt {$module->name}"];
            }
            // Paid + not yet approved → block
            return ['success' => false, 'message' => "Module trả phí — vui lòng sử dụng 'Yêu cầu cài đặt'", 'require_payment' => true];
        }

        // New install — paid modules must go through request flow
        if ($module->price > 0) {
            return ['success' => false, 'message' => "Module trả phí — vui lòng sử dụng 'Yêu cầu cài đặt'", 'require_payment' => true];
        }

        $data = [
            'tenant_id' => $tenantId,
            'module_id' => $moduleId,
            'is_active' => true,
            'status' => 'active',
            'installed_at' => now(),
            'installed_by' => $userId,
        ];

        // Add version tracking if column exists (requires migration)
        $connection = config('tenancy.database.central_connection', 'master');
        if (\Illuminate\Support\Facades\Schema::connection($connection)->hasColumn('tenant_module_subscriptions', 'installed_version')) {
            $data['installed_version'] = $module->version ?? '1.0.0';
        }

        TenantModuleSubscription::create($data);

        // Run module-specific migrations if they exist
        static::runModuleMigrations($moduleId);

        // Clear caches
        static::clearCache($tenantId);

        return ['success' => true, 'message' => "Đã cài đặt {$module->name}"];
    }

    /**
     * Run database migrations for a specific module.
     * Returns true if migrations were found and executed.
     */
    protected static function runModuleMigrations(string $moduleId): bool
    {
        $migrationPath = database_path("migrations/modules/{$moduleId}");
        if (!is_dir($migrationPath)) {
            return false;
        }

        try {
            Artisan::call('migrate', [
                '--path' => "database/migrations/modules/{$moduleId}",
                '--database' => 'tenant',
                '--realpath' => false,
                '--force' => true,
            ]);
            $output = trim(Artisan::output());
            Log::info("[ModuleRegistry] Ran migrations for module: {$moduleId}", ['output' => $output]);
            return true;
        } catch (\Exception $e) {
            Log::error("[ModuleRegistry] Migration failed for {$moduleId}: {$e->getMessage()}");
            return false;
        }
    }

    // Request a paid module (creates pending subscription)
    public static function requestModule(string $tenantId, string $moduleId, ?int $userId = null, ?string $note = null): array
    {
        $module = Module::where('module_id', $moduleId)->whereRaw('"is_active" = true')->first();
        if (!$module) {
            return ['success' => false, 'message' => "Module không tồn tại"];
        }

        $existing = TenantModuleSubscription::where('tenant_id', $tenantId)
            ->where('module_id', $moduleId)
            ->first();

        if ($existing) {
            if ($existing->is_active && $existing->status === 'active') {
                return ['success' => false, 'message' => 'Module đã được cài đặt'];
            }
            if ($existing->status === 'pending') {
                return ['success' => false, 'message' => 'Yêu cầu đang chờ duyệt'];
            }
            $existing->update([
                'status' => 'pending',
                'is_active' => false,
                'request_note' => $note,
                'installed_at' => now(),
                'installed_by' => $userId,
            ]);
        } else {
            TenantModuleSubscription::create([
                'tenant_id' => $tenantId,
                'module_id' => $moduleId,
                'is_active' => false,
                'status' => 'pending',
                'request_note' => $note,
                'installed_by' => $userId,
            ]);
        }

        $price = number_format($module->price, 0, ',', '.') . 'đ';
        return ['success' => true, 'message' => "Đã gửi yêu cầu cài đặt {$module->name} ({$price}). Vui lòng chờ admin duyệt."];
    }

    // Admin: approve a pending request
    public static function approveRequest(int $subscriptionId): array
    {
        $sub = TenantModuleSubscription::find($subscriptionId);
        if (!$sub) return ['success' => false, 'message' => 'Không tìm thấy yêu cầu'];
        if ($sub->status !== 'pending') return ['success' => false, 'message' => 'Yêu cầu không ở trạng thái chờ duyệt'];

        $sub->update([
            'status' => 'active',
            'is_active' => true,
            'installed_at' => now(),
        ]);

        // Run module-specific migrations (create tables if needed)
        static::runModuleMigrations($sub->module_id);

        // Clear caches
        static::clearCache($sub->tenant_id);

        $module = Module::where('module_id', $sub->module_id)->first();
        
        // Notify tenant
        $tenant = \App\Models\Tenant::find($sub->tenant_id);
        if ($tenant) {
            $tenant->run(function () use ($module, $sub) {
                \App\Models\Notification::create([
                    'user_id' => $sub->installed_by,
                    'type' => 'system',
                    'title' => 'Yêu cầu Module được duyệt',
                    'message' => "Yêu cầu cài đặt module '{$module->name}' đã được duyệt thành công. Bạn có thể bắt đầu sử dụng.",
                    'link' => '/settings/modules',
                    'created_at' => now(),
                ]);
            });
        }

        return ['success' => true, 'message' => "Đã duyệt: {$module->name}"];
    }

    // Admin: reject a pending request
    public static function rejectRequest(int $subscriptionId, ?string $reason = null): array
    {
        $sub = TenantModuleSubscription::find($subscriptionId);
        if (!$sub) return ['success' => false, 'message' => 'Không tìm thấy yêu cầu'];

        $sub->update([
            'status' => 'rejected',
            'is_active' => false,
            'request_note' => $reason ?? $sub->request_note,
        ]);

        $module = Module::where('module_id', $sub->module_id)->first();

        // Notify tenant
        $tenant = \App\Models\Tenant::find($sub->tenant_id);
        if ($tenant) {
            $tenant->run(function () use ($module, $sub, $reason) {
                \App\Models\Notification::create([
                    'user_id' => $sub->installed_by,
                    'type' => 'system',
                    'title' => 'Yêu cầu Module bị từ chối',
                    'message' => "Yêu cầu cài đặt module '{$module->name}' đã bị từ chối. Lời nhắn từ Admin: " . ($reason ?? $sub->request_note ?: 'Không có'),
                    'link' => '/settings/modules',
                    'created_at' => now(),
                ]);
            });
        }

        return ['success' => true, 'message' => "Đã từ chối: {$module->name}"];
    }

    // Uninstall (deactivate) a module for a tenant
    public static function uninstall(string $tenantId, string $moduleId): array
    {
        $module = Module::where('module_id', $moduleId)->first();
        $sub = TenantModuleSubscription::where('tenant_id', $tenantId)
            ->where('module_id', $moduleId)
            ->first();

        if (!$sub || !$sub->is_active) {
            return ['success' => false, 'message' => 'Module chưa được cài đặt'];
        }

        // Check if other installed modules depend on this
        $installed = self::installedModuleIds($tenantId);
        foreach (Module::whereIn('module_id', $installed)->get() as $m) {
            if (in_array($moduleId, $m->requires ?? []) && $m->module_id !== $moduleId) {
                return ['success' => false, 'message' => "Module {$m->name} đang phụ thuộc vào module này"];
            }
        }

        $sub->update(['is_active' => false]);

        // Clear caches
        static::clearCache($tenantId);

        $name = $module->name ?? $moduleId;
        return ['success' => true, 'message' => "Đã gỡ {$name}. Dữ liệu được giữ lại."];
    }

    // Get module list with install status for a tenant (for UI)
    public static function listForTenant(string $tenantId): array
    {
        $modules = Module::whereRaw('"is_active" = true')->orderBy('category')->orderBy('name')->get();
        $subscriptions = TenantModuleSubscription::where('tenant_id', $tenantId)
            ->get()
            ->keyBy('module_id');

        $result = [];
        foreach ($modules as $m) {
            $sub = $subscriptions->get($m->module_id);
            $result[] = [
                'id' => $m->module_id,
                'name' => $m->name,
                'description' => $m->description ?? '',
                'version' => $m->version,
                'icon' => $m->icon,
                'category' => $m->category,
                'price' => (int) $m->price,
                'requires' => $m->requires ?? [],
                'is_installed' => $sub && $sub->is_active,
                'status' => $sub ? $sub->status : 'none',
                'installed_at' => $sub?->installed_at?->toISOString(),
                'sidebar' => $m->sidebar,
            ];
        }

        return $result;
    }

    // Get sidebar items for installed modules of a tenant
    public static function getSidebarItems(string $tenantId): array
    {
        $installed = self::installedModuleIds($tenantId);
        $items = [];
        foreach (Module::whereIn('module_id', $installed)->get() as $m) {
            $sidebar = $m->sidebar;
            if ($sidebar && isset($sidebar['items'])) {
                $items[$m->module_id] = $sidebar;
            }
        }
        return $items;
    }

    /**
     * Clear module-related caches for a tenant.
     * Also clears site-config cache since modules affect the storefront.
     */
    public static function clearCache(string $tenantId): void
    {
        Cache::forget("tenant_modules:{$tenantId}");
        // Also clear site-config since modules list is part of it
        \App\Http\Controllers\Tenant\StorefrontController::clearSiteConfigCache($tenantId);
    }
}
