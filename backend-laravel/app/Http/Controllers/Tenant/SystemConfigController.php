<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class SystemConfigController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(private SystemConfigRepositoryInterface $repo) {}

    public function index()
    {
        $group = request()->input('group');
        return $this->successResponse($this->repo->getAll($group));
    }

    public function store(Request $request)
    {
        try {
            $items = $request->input('items', []);
            $this->repo->upsertItems($items);
            $this->logActivity('settings.updated', 'system_config', null, ['count' => count($items)]);
            return $this->successResponse(null, 'Config saved');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function showGroup($group)
    {
        return $this->successResponse($this->repo->getByGroup($group));
    }

    public function updateGroup(Request $request, $group)
    {
        try {
            $items = $request->input('items', []);
            $this->repo->updateGroup($group, $items);
            $this->logActivity('settings.updated', 'system_config', null, ['group' => $group]);
            return $this->successResponse(null, 'Config updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
