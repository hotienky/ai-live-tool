<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Banner\BannerRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BannersController extends Controller
{
    use ApiResponse;

    public function __construct(private BannerRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $banner = $this->repo->find($id);
        if (!$banner) return $this->notFoundResponse('Banner not found');
        return $this->successResponse($banner);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'image_url' => 'required|string',
                'link_url' => 'nullable|string',
                'position' => 'nullable|string|max:50',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
            ]);
            $banner = $this->repo->store($data);
            return $this->successResponse($banner, 'Banner created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $banner = $this->repo->find($id);
            if (!$banner) return $this->notFoundResponse('Banner not found');
            $this->repo->update($request->all(), $id);
            return $this->successResponse($this->repo->find($id), 'Banner updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $banner = $this->repo->find($id);
            if (!$banner) return $this->notFoundResponse('Banner not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Banner deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

