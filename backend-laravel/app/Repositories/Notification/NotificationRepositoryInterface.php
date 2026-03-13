<?php
namespace App\Repositories\Notification;

use App\Repositories\BaseRepoInterface;

interface NotificationRepositoryInterface extends BaseRepoInterface
{
    public function getForUser(int $userId);
    public function getUnreadCount(int $userId): int;
    public function markAsRead(int $id);
    public function markAllAsRead(int $userId);
}
