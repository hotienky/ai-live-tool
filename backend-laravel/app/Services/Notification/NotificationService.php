<?php

namespace App\Services\Notification;

use App\Events\Broadcast\NotificationBroadcast;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Tạo thông báo in-app cho tất cả users có role phù hợp.
     *
     * @param string      $type    Loại thông báo (vd: 'order.placed')
     * @param string      $title   Tiêu đề
     * @param string      $message Nội dung
     * @param array       $data    Payload bổ sung (order_id, product_id, v.v.)
     * @param string|null $link    Link điều hướng trong admin
     * @param string      $channel 'in_app' | 'email' | 'both'
     */
    public function notify(
        string  $type,
        string  $title,
        string  $message,
        array   $data   = [],
        ?string $link   = null,
        string  $channel = 'in_app',
    ): void {
        $roles = NotificationRoleMapper::getRoles($type);

        // Lấy tất cả user_id có role phù hợp
        $userIds = $this->getUserIdsByRoles($roles);

        if (empty($userIds)) {
            return;
        }

        $now = now();

        // Deduplication: skip users who already have a notification with same type+link in last 60s
        $existingUserIds = Notification::where('type', $type)
            ->where('link', $link)
            ->whereIn('user_id', $userIds)
            ->where('created_at', '>=', $now->copy()->subSeconds(60))
            ->pluck('user_id')
            ->toArray();

        $newUserIds = array_diff($userIds, $existingUserIds);

        if (empty($newUserIds)) {
            return;
        }

        $rows = array_map(fn(int $uid) => [
            'user_id'    => $uid,
            'type'       => $type,
            'title'      => $title,
            'message'    => $message,
            'data'       => json_encode($data),
            'link'       => $link,
            'roles'      => json_encode($roles),
            'channel'    => $channel,
            'is_read'    => false,
            'created_at' => $now,
        ], $newUserIds);

        // Bulk insert
        Notification::insert($rows);

        // Broadcast real-time (sẽ kích hoạt ở Sprint 2 khi Reverb được cài)
        $this->broadcastToRoles($roles, [
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'data'    => $data,
            'link'    => $link,
        ]);
    }

    /**
     * Lấy user IDs theo danh sách role names.
     */
    private function getUserIdsByRoles(array $roles): array
    {
        return DB::table('users as u')
            ->join('user_roles as ur', 'ur.user_id', '=', 'u.id')
            ->join('roles as r', 'r.id', '=', 'ur.role_id')
            ->whereIn('r.name', $roles)
            ->where('u.is_active', true)
            ->pluck('u.id')
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Broadcast real-time qua Laravel Reverb tới tất cả private channels của roles.
     */
    private function broadcastToRoles(array $roles, array $payload): void
    {
        try {
            broadcast(new NotificationBroadcast($roles, $payload));
        } catch (\Throwable $e) {
            // Không ảnh hưởng luồng chính nếu Reverb chưa chạy
            Log::warning('[Notification] broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Xóa thông báo hết hạn theo config retention.
     */
    public function cleanupExpired(): int
    {
        $retentionEnabled = DB::table('system_configs')
            ->where('key', 'notification.retention_enabled')
            ->value('value');

        if ($retentionEnabled !== 'true') {
            return 0;
        }

        $days = (int) (DB::table('system_configs')
            ->where('key', 'notification.retention_days')
            ->value('value') ?? 90);

        return Notification::where('created_at', '<', now()->subDays($days))->forceDelete();
    }
}
