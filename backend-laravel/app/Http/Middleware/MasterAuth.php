<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Master panel auth middleware — validates Bearer token against master_access_tokens.
 */
class MasterAuth
{
    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $token = substr($authHeader, 7);

        $tokenRecord = DB::connection('master')
            ->table('master_access_tokens')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$tokenRecord) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $user = DB::connection('master')
            ->table('master_users')
            ->select('id', 'email', 'name', 'role')
            ->where('id', $tokenRecord->user_id)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 401);
        }

        $request->attributes->set('masterUser', $user);

        return $next($request);
    }
}
