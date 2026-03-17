<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\ActivityLog\ActivityLogRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ActivityLogsController extends Controller
{
    use ApiResponse;

    public function __construct(private ActivityLogRepositoryInterface $repo) {}

    public function index(Request $request)
    {
        $limit  = (int) $request->input('limit', 30);
        $action = $request->input('action');
        $page   = (int) $request->input('page', 1);

        return $this->successResponse($this->repo->getRecent($limit, $action, $page));
    }

    public function stats()
    {
        return $this->successResponse($this->repo->getStats());
    }
}
