<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Stancl\Tenancy\Tenancy;

/**
 * Initialize tenancy by subdomain → slug lookup.
 *
 * Extracts subdomain from hostname, finds the tenant by `slug` column,
 * then initializes stancl/tenancy. This replaces the default
 * InitializeTenancyBySubdomain which uses the `domains` table.
 *
 * Also supports ?tenant= query param and X-Tenant-Slug header
 * for development environments without subdomain support.
 */
class InitializeTenancyBySlug
{
    public function __construct(protected Tenancy $tenancy) {}

    /** @var callable|null */
    public static $onFail;

    public function handle(Request $request, Closure $next)
    {
        $hostname = $request->getHost();
        $slug = $this->resolveSlug($hostname, $request);

        if (!$slug) {
            // Central domain — skip tenant initialization
            return $next($request);
        }

        try {
            $tenant = \App\Models\Tenant::where('slug', $slug)->first();

            if (!$tenant) {
                return $this->fail("Tenant not found: {$slug}", $request, $next, 404);
            }

            if ($tenant->status !== 'active') {
                return $this->fail("Tenant is suspended: {$slug}", $request, $next, 403);
            }

            $this->tenancy->initialize($tenant);

            // Store tenant on request for backward compatibility
            $request->attributes->set('tenant', $tenant);
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

    protected function resolveSlug(string $hostname, Request $request): ?string
    {
        $parts = explode('.', $hostname);
        $subdomain = $parts[0];

        // Central domains — no tenant
        $centralDomains = config('tenancy.central_domains', []);
        if (in_array($hostname, $centralDomains, true)) {
            return null;
        }

        // Skip for master subdomain
        if ($subdomain === 'master') {
            return null;
        }

        // Try subdomain first
        if (!in_array($subdomain, ['localhost', '127', '0'])) {
            return $subdomain;
        }

        // Fallback: query param or header (for dev environments)
        return $request->query('tenant') ?? $request->header('X-Tenant-Slug');
    }

    protected function fail(string $message, Request $request, Closure $next, int $status)
    {
        if (static::$onFail) {
            return (static::$onFail)(new \Exception($message), $request, $next);
        }

        return response()->json(['error' => $message], $status);
    }
}
