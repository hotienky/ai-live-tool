<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DomainManager
{
    /**
     * Thêm một tên miền tùy chỉnh cho tenant.
     */
    public static function addDomain(Tenant $tenant, string $domain, string $type = 'storefront'): array
    {
        $domain = strtolower(trim($domain));

        // Basic domain validation
        if (!preg_match('/^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,10}$/', $domain)) {
            return ['success' => false, 'message' => 'Tên miền không hợp lệ.'];
        }

        // Check if domain already exists
        $exists = DB::connection('master')->table('domains')->where('domain', $domain)->exists();
        if ($exists) {
            return ['success' => false, 'message' => 'Tên miền này đã được sử dụng trong hệ thống.'];
        }

        DB::connection('master')->table('domains')->insert([
            'domain' => $domain,
            'tenant_id' => $tenant->id,
            'type' => $type,
            'is_primary' => false,
            'verified_at' => null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return ['success' => true, 'message' => "Đã thêm tên miền {$domain}. Vui lòng trỏ DNS để xác thực."];
    }

    /**
     * Xác thực tên miền (Mock kiểm tra DNS bằng cách giả lập thành công nếu chạy local)
     */
    public static function verifyDomain(string $domain): array
    {
        $record = DB::connection('master')->table('domains')->where('domain', $domain)->first();
        if (!$record) {
            return ['success' => false, 'message' => 'Tên miền không tồn tại.'];
        }

        // In a real scenario, we'd use dns_get_record() to verify CNAME/A records.
        // For this demo, we simulate success.
        DB::connection('master')->table('domains')
            ->where('domain', $domain)
            ->update(['verified_at' => now()]);

        return ['success' => true, 'message' => 'Xác thực tên miền thành công.'];
    }

    /**
     * Đặt tên miền chính
     */
    public static function setPrimaryDomain(Tenant $tenant, string $domain): array
    {
        $record = DB::connection('master')->table('domains')
            ->where('domain', $domain)
            ->where('tenant_id', $tenant->id)
            ->first();

        if (!$record) {
            return ['success' => false, 'message' => 'Tên miền không thuộc về bạn.'];
        }

        if (!$record->verified_at) {
            return ['success' => false, 'message' => 'Chỉ có thể đặt tên miền đã xác thực làm tên miền chính.'];
        }

        // Reset other domains of the same type
        DB::connection('master')->table('domains')
            ->where('tenant_id', $tenant->id)
            ->where('type', $record->type)
            ->update(['is_primary' => false]);

        // Set this as primary
        DB::connection('master')->table('domains')
            ->where('domain', $domain)
            ->update(['is_primary' => true]);

        return ['success' => true, 'message' => "Đã thiết lập {$domain} làm tên miền chính."];
    }

    /**
     * Trigger Nginx and SSL provisioning (Mocked logic)
     */
    public static function provisionSSL(string $domain): void
    {
        Log::info("[DomainManager] Provisioning SSL certificate for {$domain} via Certbot.");
        // shell_exec("sudo certbot --nginx -d {$domain} --non-interactive --agree-tos -m admin@site.com");
    }

    public static function reloadNginx(): void
    {
        Log::info("[DomainManager] Reloading Nginx configuration.");
        // shell_exec("sudo systemctl reload nginx");
    }
}
