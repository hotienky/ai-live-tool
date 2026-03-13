<?php
namespace App\Repositories\ActivityLog;

use App\Models\ActivityLog;
use App\Repositories\BaseEloquentRepository;

class ActivityLogRepository extends BaseEloquentRepository implements ActivityLogRepositoryInterface
{
    public function __construct(ActivityLog $model)
    {
        parent::__construct($model);
    }

    public function getRecent(int $limit = 100)
    {
        return $this->model->orderByDesc('created_at')->limit($limit)->get();
    }

    public function getStats(): array
    {
        return ['total' => $this->model->count()];
    }
}
