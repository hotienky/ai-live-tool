<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * API Key Authentication Middleware
 *
 * Validates X-API-Key header, initializes tenant context,
 * enforces rate limiting, and tracks usage.
 */
class ApiKeyAuth
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('X-API-Key');

        if (!$key) {
            return response()->json([
                'type' => 'error',
                'message' => 'API key required. Pass it via X-API-Key header.',
                'code' => 401,
            ], 401);
        }

        $apiKey = ApiKey::where('key', $key)
            ->where('is_active', true)
            ->first();

        if (!$apiKey) {
            return response()->json([
                'type' => 'error',
                'message' => 'Invalid or inactive API key.',
                'code' => 401,
            ], 401);
        }

        // Rate limiting (sliding window via Redis/Cache)
        $rateLimitKey = 'api_rate:' . $apiKey->id;
        $currentCount = Cache::get($rateLimitKey, 0);
        $limit = $apiKey->rate_limit ?? 1000;

        if ($currentCount >= $limit) {
            return response()->json([
                'type' => 'error',
                'message' => 'Rate limit exceeded. Limit: ' . $limit . ' requests/hour.',
                'code' => 429,
                'retry_after' => 3600,
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $limit,
                'X-RateLimit-Remaining' => 0,
                'Retry-After' => 3600,
            ]);
        }

        // Increment counter (expires after 1 hour)
        Cache::put($rateLimitKey, $currentCount + 1, now()->addHour());

        // CORS check (if allowed_origins configured)
        $origins = $apiKey->allowed_origins;
        if (!empty($origins) && is_array($origins)) {
            $origin = $request->header('Origin');
            if ($origin && !in_array($origin, $origins) && !in_array('*', $origins)) {
                return response()->json([
                    'type' => 'error',
                    'message' => 'Origin not allowed.',
                    'code' => 403,
                ], 403);
            }
        }

        // Track usage
        $apiKey->increment('usage_count');
        $apiKey->update(['last_used_at' => now()]);

        // Attach API key info to request
        $request->merge(['_api_key' => $apiKey]);

        // Add rate limit headers to response
        $response = $next($request);

        if (method_exists($response, 'withHeaders')) {
            $response->withHeaders([
                'X-RateLimit-Limit' => $limit,
                'X-RateLimit-Remaining' => max(0, $limit - $currentCount - 1),
            ]);
        }

        return $response;
    }
}
