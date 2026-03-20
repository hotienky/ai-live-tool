<?php

namespace App\Repositories\Notification;

use App\Repositories\BaseRepoInterface;

interface NotificationRepositoryInterface extends BaseRepoInterface
{
    public function getForUser(int $userId, ?string $type = null, int $perPage = 20);
    public function getUnreadCount(int $userId): int;
    public function markAsRead(int $id): void;
    public function markAllAsRead(int $userId): void;
    public function deleteForUser(int $notificationId, int $userId): bool;
    public function deleteAllReadForUser(int $userId): int;
}
