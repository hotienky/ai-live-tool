<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitShopAuth
{
    public function handle(Request $request, Closure $next, string $action = 'login')
    {
        $key = 'shop_auth:' . $action . ':' . $request->ip();

        $maxAttempts = match ($action) {
            'register' => 3,
            'login' => 5,
            'reset' => 3,
            default => 10,
        };

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'type' => 'error',
                'message' => "Quá nhiều yêu cầu. Vui lòng thử lại sau {$seconds} giây.",
                'code' => 429,
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, 60); // decay in 60 seconds

        return $next($request);
    }
}
