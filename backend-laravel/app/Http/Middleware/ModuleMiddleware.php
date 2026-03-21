<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\ModuleRegistry;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if a required module is installed for the current tenant.
 * 
 * Usage in routes:
 *   Route::middleware('module:ecom')->group(function () { ... });
 *   Route::middleware('module:shipping')->group(function () { ... });
 */
class ModuleMiddleware
{
    public function handle(Request $request, Closure $next, string $moduleId): Response
    {
        $tenantId = tenant('id') ?? $request->header('X-Tenant', '');

        if (!$tenantId) {
            return response()->json([
                'type' => 'error',
                'message' => 'Tenant not identified',
            ], 403);
        }

        // Check if the module is installed for this tenant
        if (!ModuleRegistry::isInstalled($tenantId, $moduleId)) {
            return response()->json([
                'type' => 'error',
                'message' => "Module '{$moduleId}' is not installed for this tenant.",
                'code' => 'MODULE_NOT_INSTALLED',
            ], 404);
        }

        return $next($request);
    }
}
