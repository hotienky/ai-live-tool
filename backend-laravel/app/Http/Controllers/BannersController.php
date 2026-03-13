<?php

namespace App\Http\Controllers;

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

    public function store(Request $request)
    {
        try {
            $banner = $this->repo->store($request->all());
            return $this->successResponse($banner, 'Banner created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Banner updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Banner deleted');
    }
}
