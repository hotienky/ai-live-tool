<?php
namespace App\Repositories\ActivityLog;

use App\Models\ActivityLog;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;

class ActivityLogRepository extends BaseEloquentRepository implements ActivityLogRepositoryInterface
{
    public function __construct(ActivityLog $model)
    {
        parent::__construct($model);
    }

    public function getRecent(int $limit = 50, ?string $action = null, int $page = 1)
    {
        $query = DB::table('activity_logs')
            ->leftJoin('users', 'users.id', '=', 'activity_logs.user_id')
            ->select(
                'activity_logs.id',
                'activity_logs.user_id',
                'activity_logs.action',
                'activity_logs.entity_type',
                'activity_logs.entity_id',
                'activity_logs.data',
                'activity_logs.created_at',
                'users.name as user_name'
            )
            ->orderByDesc('activity_logs.created_at');

        if ($action) {
            $query->where('activity_logs.action', $action);
        }

        $total = $query->count();
        $lastPage = max(1, (int) ceil($total / $limit));
        $offset = ($page - 1) * $limit;

        $items = $query->offset($offset)->limit($limit)->get()->map(function ($item) {
            $item->data = $item->data ? json_decode($item->data, true) : null;
            return $item;
        });

        return [
            'data' => $items,
            'meta' => [
                'page'     => $page,
                'lastPage' => $lastPage,
                'total'    => $total,
            ],
        ];
    }

    public function getStats(): array
    {
        $total = $this->model->count();
        $byAction = DB::table('activity_logs')
            ->select('action', DB::raw('COUNT(*) as count'))
            ->groupBy('action')
            ->pluck('count', 'action')
            ->toArray();

        return ['total' => $total, 'byAction' => $byAction];
    }
}
