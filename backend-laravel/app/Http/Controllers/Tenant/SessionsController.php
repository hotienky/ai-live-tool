<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Session\SessionRepositoryInterface;
use App\Traits\ApiResponse;

class SessionsController extends Controller
{
    use ApiResponse;

    public function __construct(private SessionRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $session = $this->repo->find($id);
        return $session ? $this->successResponse($session) : $this->notFoundResponse('Session not found');
    }
}
