<?php

namespace App\Repositories\Notification;

use App\Models\Notification;
use App\Repositories\BaseEloquentRepository;

class NotificationRepository extends BaseEloquentRepository implements NotificationRepositoryInterface
{
    public function __construct(Notification $model)
    {
        parent::__construct($model);
    }

    public function getForUser(int $userId, ?string $type = null, int $perPage = 20)
    {
        $query = $this->model
            ->forUser($userId)
            ->notExpired()
            ->orderByDesc('created_at');

        if ($type) {
            // Prefix match: 'order' → matches 'order.placed', 'order.cancelled', etc.
            $query->where('type', 'LIKE', $type . '.%');
        }

        return $query->paginate($perPage);
    }

    public function getUnreadCount(int $userId): int
    {
        return $this->model
            ->forUser($userId)
            ->unread()
            ->notExpired()
            ->count();
    }

    public function markAsRead(int $id): void
    {
        $this->model->where('id', $id)->whereNull('read_at')->update(['read_at' => now(), 'is_read' => true]);
    }

    public function markAllAsRead(int $userId): void
    {
        $this->model
            ->forUser($userId)
            ->unread()
            ->update(['read_at' => now(), 'is_read' => true]);
    }

    public function deleteForUser(int $notificationId, int $userId): bool
    {
        return (bool) $this->model
            ->forUser($userId)
            ->where('id', $notificationId)
            ->delete();
    }

    public function deleteAllReadForUser(int $userId): int
    {
        return $this->model
            ->forUser($userId)
            ->whereNotNull('read_at')
            ->delete();
    }
}
