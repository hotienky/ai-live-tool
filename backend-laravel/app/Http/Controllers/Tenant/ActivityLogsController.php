<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\ActivityLog\ActivityLogRepositoryInterface;
use App\Traits\ApiResponse;

class ActivityLogsController extends Controller
{
    use ApiResponse;

    public function __construct(private ActivityLogRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->getRecent());
    }

    public function stats()
    {
        return $this->successResponse($this->repo->getStats());
    }
}
