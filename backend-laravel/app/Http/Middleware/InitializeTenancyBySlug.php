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
            $tenant = \App\Models\Tenant::where('slug', $resolved['slug'])->first();

            if (!$tenant) {
                return $this->fail("Tenant not found: {$resolved['slug']}", $request, $next, 404);
            }

            if ($tenant->status !== 'active') {
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
        $parts = explode('.', $hostname);
        $subdomain = $parts[0];

        // Central domains — no tenant
        $centralDomains = config('tenancy.central_domains', []);
        if (\in_array($hostname, $centralDomains, true)) {
            return null;
        }

        // Skip for master subdomain
        if ($subdomain === 'master') {
            return null;
        }

        // 1. Try subdomain first (fashionvn.super.vn → "fashionvn")
        if (!\in_array($subdomain, ['localhost', '127', '0'])) {
            return ['slug' => $subdomain];
        }

        // 2. Custom domain lookup (www.fashionvn.com → tenant)
        $customDomain = $this->resolveCustomDomain($hostname);
        if ($customDomain) {
            return $customDomain;
        }

        // 3. Fallback: query param or header (for dev environments)
        $fallback = $request->query('tenant') ?? $request->header('X-Tenant-Slug');
        return $fallback ? ['slug' => $fallback] : null;
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
