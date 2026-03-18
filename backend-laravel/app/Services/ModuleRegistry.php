<?php

namespace App\Services;

use App\Models\Module;
use App\Models\TenantModuleSubscription;

class ModuleRegistry
{
    // Get all active modules from master DB
    public static function availableModules(): array
    {
        return Module::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->keyBy('module_id')
            ->toArray();
    }

    // Get installed module IDs for a specific tenant
    public static function installedModuleIds(string $tenantId): array
    {
        return TenantModuleSubscription::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->pluck('module_id')
            ->toArray();
    }

    // Check if a module is installed for a tenant
    public static function isInstalled(string $tenantId, string $moduleId): bool
    {
        return in_array($moduleId, self::installedModuleIds($tenantId));
    }

    // Install a module for a tenant
    public static function install(string $tenantId, string $moduleId, ?int $userId = null): array
    {
        $module = Module::where('module_id', $moduleId)->where('is_active', true)->first();
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
                return ['success' => true, 'message' => "Đã cài đặt {$module->name}"];
            }
            // Paid + not yet approved → block
            return ['success' => false, 'message' => "Module trả phí — vui lòng sử dụng 'Yêu cầu cài đặt'", 'require_payment' => true];
        }

        // New install — paid modules must go through request flow
        if ($module->price > 0) {
            return ['success' => false, 'message' => "Module trả phí — vui lòng sử dụng 'Yêu cầu cài đặt'", 'require_payment' => true];
        }

        TenantModuleSubscription::create([
            'tenant_id' => $tenantId,
            'module_id' => $moduleId,
            'is_active' => true,
            'status' => 'active',
            'installed_at' => now(),
            'installed_by' => $userId,
        ]);

        return ['success' => true, 'message' => "Đã cài đặt {$module->name}"];
    }

    // Request a paid module (creates pending subscription)
    public static function requestModule(string $tenantId, string $moduleId, ?int $userId = null, ?string $note = null): array
    {
        $module = Module::where('module_id', $moduleId)->where('is_active', true)->first();
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

        $module = Module::where('module_id', $sub->module_id)->first();
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
        $name = $module->name ?? $moduleId;
        return ['success' => true, 'message' => "Đã gỡ {$name}. Dữ liệu được giữ lại."];
    }

    // Get module list with install status for a tenant (for UI)
    public static function listForTenant(string $tenantId): array
    {
        $modules = Module::where('is_active', true)->orderBy('category')->orderBy('name')->get();
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
}
