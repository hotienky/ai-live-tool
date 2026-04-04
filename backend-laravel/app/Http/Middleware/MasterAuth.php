<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Master panel auth middleware — validates Bearer token against master_access_tokens.
 * Loads user role and permissions for RBAC.
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
            ->select('id', 'email', 'name', 'role_id', 'is_active')
            ->where('id', $tokenRecord->user_id)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['error' => 'Account is disabled'], 403);
        }

        // Load role and permissions
        $role = null;
        $permissions = [];
        if ($user->role_id) {
            $role = DB::connection('master')
                ->table('master_roles')
                ->where('id', $user->role_id)
                ->first();
            if ($role) {
                $permissions = json_decode($role->permissions, true) ?: [];
                $user->role = $role->name;
                $user->role_display_name = $role->display_name ?? $role->name;
            }
        }

        $request->attributes->set('masterUser', $user);
        $request->attributes->set('masterPermissions', $permissions);

        return $next($request);
    }
}
