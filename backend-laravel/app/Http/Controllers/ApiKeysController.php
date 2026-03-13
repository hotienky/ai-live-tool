<?php

namespace App\Http\Controllers;

use App\Repositories\ApiKey\ApiKeyRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ApiKeysController extends Controller
{
    use ApiResponse;

    public function __construct(private ApiKeyRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        $apiKey = $this->repo->createWithKey($request->all());
        return $this->successResponse($apiKey, 'API Key created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'API Key deleted');
    }
}
