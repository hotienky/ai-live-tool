<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Stancl\Tenancy\Tenancy;

/**
 * Initialize tenancy by subdomain → slug lookup, with custom domain fallback.
 *
 * Resolution order:
 * 1. Subdomain extraction (fashionvn.super.vn → "fashionvn")
 * 2. Custom domain lookup in `domains` table (www.fashionvn.com → tenant)
 * 3. Query param ?tenant= or X-Tenant-Slug header (dev fallback)
 */
class InitializeTenancyBySlug
{
    public function __construct(protected Tenancy $tenancy) {}

    /** @var callable|null */
    public static $onFail;

    public function handle(Request $request, Closure $next)
    {
        $hostname = $request->getHost();
        $resolved = $this->resolveTenant($hostname, $request);

        if (!$resolved) {
            // Central domain — skip tenant initialization
            return $next($request);
        }

        try {
            $tenant = $this->resolveTenantBySlug($resolved['slug']);

            if (!$tenant) {
                return $this->fail("Tenant not found: {$resolved['slug']}", $request, $next, 404);
            }

            if ($tenant->status !== 'active') {
                // Xoá cache ngay khi phát hiện suspended để tránh serve stale data
                Cache::forget("tenant_slug:{$resolved['slug']}");
                return $this->fail("Tenant is suspended: {$resolved['slug']}", $request, $next, 403);
            }

            $this->tenancy->initialize($tenant);

            // Store tenant on request for backward compatibility
            $request->attributes->set('tenant', $tenant);

            // Store domain type so downstream code knows the context
            if (isset($resolved['domain_type'])) {
                $request->attributes->set('domain_type', $resolved['domain_type']);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('[InitializeTenancyBySlug] Error: ' . $e->getMessage());
            return $this->fail(
                app()->isLocal() ? 'Tenant resolution failed: ' . $e->getMessage() : 'Tenant resolution failed',
                $request,
                $next,
                500
            );
        }

        return $next($request);
    }

    /**
     * Resolve tenant slug (and optional domain type) from the request.
     *
     * @return array{slug: string, domain_type?: string}|null
     */
    protected function resolveTenant(string $hostname, Request $request): ?array
    {
        // Central domains — check for explicit override first, then skip
        $centralDomains = config('tenancy.central_domains', []);
        if (\in_array($hostname, $centralDomains, true)) {
            // Allow explicit tenant override via query param or header (dev/API)
            $fallback = $request->query('tenant') ?? $request->header('X-Tenant-Slug') ?? $request->header('X-Tenant');
            return $fallback ? ['slug' => $fallback] : null;
        }

        $parts = explode('.', $hostname);
        $subdomain = $parts[0];

        // Skip for master subdomain
        if ($subdomain === 'master') {
            return null;
        }

        // Check if this is a known platform domain (*.super.vn, *.localhost, etc.)
        $isPlatformDomain = str_ends_with($hostname, '.super.vn')
            || str_ends_with($hostname, '.localhost')
            || $hostname === 'localhost';

        if ($isPlatformDomain) {
            // Subdomain extraction for platform domains
            if (!\in_array($subdomain, ['localhost', '127', '0'])) {
                return ['slug' => $subdomain];
            }
        } else {
            // Custom domain — lookup in domains table FIRST
            $customDomain = $this->resolveCustomDomain($hostname);
            if ($customDomain) {
                return $customDomain;
            }

            // Fallback: try without www prefix
            if ($subdomain === 'www' && count($parts) > 2) {
                $bareHost = implode('.', array_slice($parts, 1));
                $customDomain = $this->resolveCustomDomain($bareHost);
                if ($customDomain) {
                    return $customDomain;
                }
            }
        }

        // 3. Fallback: query param or header (for dev environments)
        $fallback = $request->query('tenant') ?? $request->header('X-Tenant-Slug');
        return $fallback ? ['slug' => $fallback] : null;
    }

    /**
     * Lookup tenant by slug with Redis cache (10 min TTL).
     * Cache dùng central Redis (chưa initialize tenancy tại thời điểm này).
     */
    protected function resolveTenantBySlug(string $slug): ?\App\Models\Tenant
    {
        $cacheKey = "tenant_slug:{$slug}";

        // Cache hit: rebuild Tenant từ các column cần thiết
        $cached = Cache::get($cacheKey);
        if ($cached === 'not_found') {
            return null;
        }
        if (is_array($cached)) {
            // db_name là column custom của Tenant model (xem getCustomColumns()),
            // dùng bởi DatabaseConfig::generateDatabaseNamesUsing()
            return (new \App\Models\Tenant)->forceFill($cached);
        }

        $tenant = \App\Models\Tenant::where('slug', $slug)->first();

        // Fallback: try matching db_name = 'tenant_{slug}' (handles events/event, etc.)
        if (!$tenant) {
            $tenant = \App\Models\Tenant::where('db_name', 'tenant_' . $slug)->first();
        }

        if (!$tenant) {
            Cache::put($cacheKey, 'not_found', 600);
            return null;
        }

        // Cache đủ các column mà DatabaseTenancyBootstrapper cần
        Cache::put($cacheKey, $tenant->only(['id', 'slug', 'name', 'db_name', 'status', 'plan']), 600);

        return $tenant;
    }

    /**
     * Lookup custom domain in `domains` table with Redis cache.
     *
     * @return array{slug: string, domain_type: string}|null
     */
    protected function resolveCustomDomain(string $hostname): ?array
    {
        $cacheKey = "custom_domain:{$hostname}";

        // Check cache first
        $cached = Cache::get($cacheKey);
        if ($cached === 'none') {
            return null;
        }
        if ($cached) {
            return $cached;
        }

        // Lookup in domains table
        $domain = \Stancl\Tenancy\Database\Models\Domain::where('domain', $hostname)->first();

        if (!$domain) {
            Cache::put($cacheKey, 'none', 600); // cache miss for 10 min
            return null;
        }

        $tenant = \App\Models\Tenant::find($domain->tenant_id);
        if (!$tenant) {
            Cache::put($cacheKey, 'none', 600);
            return null;
        }

        $result = [
            'slug' => $tenant->slug,
            'domain_type' => $domain->type ?? 'storefront',
        ];

        Cache::put($cacheKey, $result, 3600); // cache hit for 1 hour

        return $result;
    }

    protected function fail(string $message, Request $request, Closure $next, int $status)
    {
        if (static::$onFail) {
            return (static::$onFail)(new \Exception($message), $request, $next);
        }

        return response()->json(['error' => $message], $status);
    }
}
