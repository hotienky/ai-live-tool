<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Brand\BrandRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandsController extends Controller
{
    use ApiResponse;

    public function __construct(private BrandRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $brand = $this->repo->find($id);
        if (!$brand) return $this->notFoundResponse('Brand not found');
        return $this->successResponse($brand);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate(['name' => 'required|string', 'slug' => 'nullable|string', 'description' => 'nullable|string', 'image_url' => 'nullable|string', 'is_active' => 'nullable|boolean']);
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
            $brand = $this->repo->store($data);
            return $this->successResponse($brand, 'Brand created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Brand updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Brand deleted');
    }
}

