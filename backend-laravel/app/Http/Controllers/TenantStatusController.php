<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Lightweight tenant status check — used by Nginx auth_request
 * to block suspended tenants before serving the frontend SPA.
 *
 * Returns 200 if active, 403 if suspended/not found.
 */
class TenantStatusController extends Controller
{
    public function __invoke(Request $request)
    {
        $slug = $this->resolveSlug($request);

        if (!$slug) {
            return response()->json(['status' => 'ok'], 200);
        }

        $cacheKey = "tenant_status:{$slug}";
        $status = Cache::remember($cacheKey, 60, function () use ($slug) {
            $tenant = \App\Models\Tenant::where('slug', $slug)->first(['id', 'slug', 'status', 'name', 'data', 'settings']);
            // Fallback: try matching db_name = 'tenant_{slug}' (handles events/event mismatch etc.)
            if (!$tenant) {
                $tenant = \App\Models\Tenant::where('db_name', 'tenant_' . $slug)->first(['id', 'slug', 'status', 'name', 'data', 'settings']);
            }
            if (!$tenant) return null;
            
            // Safely decode settings — prefer dedicated column, fallback to data JSON
            $settings = $tenant->settings ?? ($tenant->data['settings'] ?? []);
            if (!is_array($settings)) {
                $settings = [];
            }
            
            return [
                'status' => $tenant->status, 
                'name' => $tenant->name, 
                'features' => $tenant->data['features'] ?? 'all',
                'onboarded' => $settings['onboarded'] ?? false,
            ];
        });

        if (!$status) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        if ($status['status'] !== 'active') {
            return response()->json([
                'error' => 'Tenant is suspended',
                'tenant_name' => $status['name'],
            ], 403);
        }

        // Block storefront access if tenant only has livestream features
        $checkType = $request->header('X-Check-Type');
        if ($checkType === 'storefront' && ($status['features'] ?? 'all') === 'livestream') {
            return response()->json([
                'error' => 'Storefront is not available for this plan',
                'tenant_name' => $status['name'],
            ], 403);
        }

        return response()->json([
            'status' => 'active',
            'features' => $status['features'] ?? 'all',
            'onboarded' => $status['onboarded'] ?? false,
        ], 200);
    }

    private function resolveSlug(Request $request): ?string
    {
        // From X-Tenant header (set by Nginx)
        if ($slug = $request->header('X-Tenant')) {
            return $slug;
        }

        // From hostname subdomain
        $host = $request->getHost();
        $parts = explode('.', $host);

        // *.cms.super.vn → extract tenant from first part
        if (str_contains($host, '.cms.')) {
            return $parts[0] !== 'master' ? $parts[0] : null;
        }

        // *.super.vn → extract tenant from first part
        if (str_ends_with($host, '.super.vn') || str_ends_with($host, '.localhost')) {
            $sub = $parts[0];
            return !in_array($sub, ['master', 'cms', 'api', 'admin', 'www', 'localhost']) ? $sub : null;
        }

        return null;
    }
}
