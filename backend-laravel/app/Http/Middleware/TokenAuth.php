<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Token-based auth middleware — compatible with AdonisJS auth_access_tokens table.
 */
class TokenAuth
{
    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $token = substr($authHeader, 7);
        $hash = hash('sha256', $token);

        $tokenRecord = DB::table('auth_access_tokens')
            ->where('hash', $hash)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$tokenRecord) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $user = DB::table('users')
            ->where('id', $tokenRecord->tokenable_id)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 401);
        }

        // Update last used
        DB::table('auth_access_tokens')
            ->where('id', $tokenRecord->id)
            ->update(['last_used_at' => now()]);

        // Store on request
        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
