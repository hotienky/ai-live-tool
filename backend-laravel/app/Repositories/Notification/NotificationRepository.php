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

    public function getForUser(int $userId)
    {
        return $this->model->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function getUnreadCount(int $userId): int
    {
        return $this->model->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function markAsRead(int $id)
    {
        return $this->update(['read_at' => now()], $id);
    }

    public function markAllAsRead(int $userId)
    {
        return $this->model->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
