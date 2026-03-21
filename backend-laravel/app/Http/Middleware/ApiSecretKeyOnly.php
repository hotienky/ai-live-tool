<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Ensures the API key is a secret key (sk_*) for write operations.
 */
class ApiSecretKeyOnly
{
    public function handle(Request $request, Closure $next)
    {
        $apiKey = $request->get('_api_key');

        if (!$apiKey || ($apiKey->type ?? 'public') !== 'secret') {
            return response()->json([
                'type' => 'error',
                'message' => 'Write operations require a secret API key (sk_*).',
                'code' => 403,
            ], 403);
        }

        return $next($request);
    }
}
