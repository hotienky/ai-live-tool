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

        // ── Load RBAC: role + permissions (safe if tables don't exist) ──
        try {
            $role = DB::table('roles')
                ->join('user_roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('user_roles.user_id', $user->id)
                ->select('roles.id', 'roles.name', 'roles.display_name', 'roles.permissions as role_permissions_json')
                ->first();

            // Fallback to users.role_id if user_roles pivot empty
            if (!$role && !empty($user->role_id)) {
                $role = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->select('id', 'name', 'display_name', 'permissions as role_permissions_json')
                    ->first();
            }

            if ($role) {
                $user->role = (object) [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                ];

                $jsonPerms = json_decode($role->role_permissions_json ?? '[]', true);
                if (is_array($jsonPerms) && in_array('*', $jsonPerms)) {
                    $user->permissions = ['*'];
                } else {
                    $user->permissions = DB::table('role_permissions')
                        ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                        ->where('role_permissions.role_id', $role->id)
                        ->pluck('permissions.name')
                        ->unique()
                        ->values()
                        ->toArray();
                    if (is_array($jsonPerms)) {
                        foreach ($jsonPerms as $p) {
                            if (str_contains($p, '*') && !in_array($p, $user->permissions)) {
                                $user->permissions[] = $p;
                            }
                        }
                    }
                }
            } else {
                $user->role = null;
                $user->permissions = [];
            }
        } catch (\Exception $e) {
            // RBAC tables may not exist yet — grant full access
            $user->role = null;
            $user->permissions = ['*'];
        }

        // Update last used
        DB::table('auth_access_tokens')
            ->where('id', $tokenRecord->id)
            ->update(['last_used_at' => now()]);

        // Store on request
        $request->attributes->set('auth_user', $user);
        $request->attributes->set('user_permissions', $user->permissions);

        return $next($request);
    }
}
