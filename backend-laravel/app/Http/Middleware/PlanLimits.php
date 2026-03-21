<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\BillingService;

class PlanLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $resource  The resource to check limit for (e.g., 'page', 'module')
     */
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $tenantId = tenant('id');
        
        if (!$tenantId) {
            return $next($request); // Proceed if not in tenant context
        }
        
        if (!BillingService::canCreate($tenantId, $resource)) {
            return response()->json([
                'success' => false,
                'message' => "Hành động bị giới hạn bởi gói cước hiện tại. Vui lòng nâng cấp để tiếp tục sử dụng tính năng này."
            ], 403);
        }

        return $next($request);
    }
}
