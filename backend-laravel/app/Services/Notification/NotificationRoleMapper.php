<?php

namespace App\Services\Notification;

/**
 * Định nghĩa role nào nhận loại thông báo nào.
 * Roles: super_admin, manager, editor, viewer
 */
class NotificationRoleMapper
{
    // type => danh sách role được nhận thông báo
    public const MAP = [
        // Nhóm 1: Hành động khách hàng
        'order.placed'              => ['super_admin', 'manager'],
        'order.cancelled'           => ['super_admin', 'manager'],
        'order.status_changed'      => ['super_admin', 'manager', 'editor'],
        'order.pending_too_long'    => ['super_admin', 'manager'],
        'order.payment_failed'      => ['super_admin', 'manager'],

        // Nhóm 2: Sản phẩm / vận hành
        'review.submitted'          => ['super_admin', 'manager', 'editor'],
        'product.stock_low'         => ['super_admin', 'manager'],
        'product.out_of_stock'      => ['super_admin', 'manager'],

        // Nhóm 3: Thay đổi cấu hình/CMS
        'settings.changed'          => ['super_admin'],
        'api_key.created'           => ['super_admin'],
        'role.permission_changed'   => ['super_admin'],
        'user.created'              => ['super_admin'],

        // Nhóm 4: Subscription / gói
        'subscription.expiring'     => ['super_admin'],
        'subscription.expired'      => ['super_admin'],
        'module.subscribed'         => ['super_admin', 'manager'],
        'module.unsubscribed'       => ['super_admin'],

        // Nhóm 5: Bảo mật
        'security.login_new_device' => ['super_admin'],
        'security.password_changed' => ['super_admin'],
    ];

    public static function getRoles(string $type): array
    {
        return self::MAP[$type] ?? ['super_admin'];
    }
}
