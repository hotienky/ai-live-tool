<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Repositories\Redirect\RedirectRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RedirectsController extends Controller
{
    use ApiResponse;

    public function __construct(private RedirectRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'source_url' => 'required|string|max:500',
                'target_url' => 'required|string|max:500',
                'status_code' => 'nullable|integer|in:301,302,307',
                'is_active' => 'nullable|boolean',
            ]);
            $redirect = $this->repo->store($data);
            return $this->successResponse($redirect, 'Redirect created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $redirect = $this->repo->find($id);
            if (!$redirect) return $this->notFoundResponse('Redirect not found');
            $this->repo->update($request->all(), $id);
            return $this->successResponse($this->repo->find($id), 'Redirect updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $redirect = $this->repo->find($id);
            if (!$redirect) return $this->notFoundResponse('Redirect not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Redirect deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
