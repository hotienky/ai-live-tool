<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;

/**
 * Private channel: thông báo cho 1 user cụ thể.
 * Chỉ user đó mới được subscribe.
 */
Broadcast::channel('admin.user.{userId}', function ($user, int $userId) {
    return (int) $user->id === $userId;
});

/**
 * Private channel: thông báo theo role trong tenant.
 * User được subscribe nếu có role đó.
 * Channel: admin.role.{roleName}  (vd: admin.role.super_admin)
 */
Broadcast::channel('admin.role.{roleName}', function ($user, string $roleName) {
    return DB::table('user_roles as ur')
        ->join('roles as r', 'r.id', '=', 'ur.role_id')
        ->where('ur.user_id', $user->id)
        ->where('r.name', $roleName)
        ->exists();
});
