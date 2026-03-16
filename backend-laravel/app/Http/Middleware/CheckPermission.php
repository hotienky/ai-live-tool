<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Check if the authenticated user has the required permission.
 *
 * Usage in routes:
 *   ->middleware('permission:products.edit')
 *   ->middleware('permission:orders.view,orders.edit')  // any of these
 */
class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions)
    {
        $user = $request->attributes->get('auth_user');

        if (!$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Load user permissions if not already loaded
        $userPermissions = $request->attributes->get('user_permissions');
        if ($userPermissions === null) {
            $userPermissions = $this->loadUserPermissions($user->id);
            $request->attributes->set('user_permissions', $userPermissions);
        }

        // Super admin bypass — if permissions JSON contains '*'
        if (in_array('*', $userPermissions)) {
            return $next($request);
        }

        // Check if user has ANY of the required permissions
        foreach ($permissions as $perm) {
            // Direct match
            if (in_array($perm, $userPermissions)) {
                return $next($request);
            }

            // Wildcard match: 'products.*' covers 'products.view'
            $module = explode('.', $perm)[0];
            if (in_array($module . '.*', $userPermissions)) {
                return $next($request);
            }

            // '*.view' wildcard
            $action = explode('.', $perm)[1] ?? '';
            if (in_array('*.' . $action, $userPermissions)) {
                return $next($request);
            }
        }

        return response()->json([
            'error' => 'Bạn không có quyền thực hiện hành động này',
            'required_permissions' => $permissions,
        ], 403);
    }

    private function loadUserPermissions(int $userId): array
    {
        // Get role from user_roles pivot
        $roleIds = DB::table('user_roles')
            ->where('user_id', $userId)
            ->pluck('role_id');

        if ($roleIds->isEmpty()) {
            // Fallback: check users.role_id
            $roleId = DB::table('users')->where('id', $userId)->value('role_id');
            if ($roleId) {
                $roleIds = collect([$roleId]);
            } else {
                return [];
            }
        }

        // Check if any role has wildcard '*' in JSON permissions
        $roles = DB::table('roles')->whereIn('id', $roleIds)->get();
        foreach ($roles as $role) {
            $jsonPerms = json_decode($role->permissions ?? '[]', true);
            if (is_array($jsonPerms) && in_array('*', $jsonPerms)) {
                return ['*'];
            }
        }

        // Load from role_permissions pivot
        $permNames = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->whereIn('role_permissions.role_id', $roleIds)
            ->pluck('permissions.name')
            ->unique()
            ->values()
            ->toArray();

        // Also include wildcard patterns from roles JSON
        foreach ($roles as $role) {
            $jsonPerms = json_decode($role->permissions ?? '[]', true);
            if (is_array($jsonPerms)) {
                foreach ($jsonPerms as $p) {
                    if (str_contains($p, '*') && !in_array($p, $permNames)) {
                        $permNames[] = $p;
                    }
                }
            }
        }

        return $permNames;
    }
}
