<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Tenant Middleware — Identifies tenant from subdomain, patches DB connection.
 *
 * Flow:
 * 1. Extract subdomain from hostname
 * 2. Lookup tenant in master DB
 * 3. Dynamically reconfigure default 'pgsql' connection to point to tenant DB
 * 4. Store tenant info on request for downstream controllers
 */
class TenantMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $hostname = $request->getHost();
        $parts = explode('.', $hostname);
        $subdomain = $parts[0];

        // Skip for master subdomain
        if ($subdomain === 'master') {
            return $next($request);
        }

        // Identify tenant slug
        $tenantSlug = null;
        if (!in_array($subdomain, ['localhost', '127', '0'])) {
            $tenantSlug = $subdomain;
        } else {
            $tenantSlug = $request->query('tenant') ?? $request->header('X-Tenant-Slug');
        }

        if (!$tenantSlug) {
            return response()->json([
                'error' => 'Tenant not identified.',
                'hint' => 'Use subdomain, ?tenant=slug query param, or X-Tenant-Slug header',
            ], 400);
        }

        try {
            // Lookup tenant in master DB
            $tenant = DB::connection('master')
                ->table('tenants')
                ->where('slug', $tenantSlug)
                ->first();

            if (!$tenant) {
                return response()->json([
                    'error' => 'Tenant not found',
                    'slug' => $tenantSlug,
                ], 404);
            }

            if ($tenant->status !== 'active') {
                return response()->json([
                    'error' => 'Tenant is suspended',
                    'slug' => $tenantSlug,
                ], 403);
            }

            // Dynamically reconfigure the default 'pgsql' connection
            Config::set('database.connections.pgsql.database', $tenant->db_name);
            DB::purge('pgsql');
            DB::reconnect('pgsql');

            // Store tenant on request
            $request->attributes->set('tenant', $tenant);

        } catch (\Exception $e) {
            \Log::error('[TenantMiddleware] Error: ' . $e->getMessage());
            return response()->json(['error' => 'Tenant resolution failed'], 500);
        }

        return $next($request);
    }
}
