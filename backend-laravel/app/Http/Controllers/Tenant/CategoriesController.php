<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Category\CategoryRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoriesController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(private CategoryRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->getCategories());
    }

    public function show($id)
    {
        $category = $this->repo->find($id);
        if (!$category) return $this->notFoundResponse('Category not found');
        return $this->successResponse($category);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate(['name' => 'required|string', 'slug' => 'nullable|string', 'description' => 'nullable|string', 'image_url' => 'nullable|string', 'parent_id' => 'nullable|integer', 'sort_order' => 'nullable|integer', 'is_active' => 'nullable|boolean']);
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
            $category = $this->repo->store($data);
            $this->logActivity('category.created', 'category', $category->id, ['name' => $data['name']]);
            return $this->successResponse($category, 'Category created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        $this->logActivity('category.updated', 'category', $id);
        return $this->successResponse($this->repo->find($id), 'Category updated');
    }

    public function destroy($id)
    {
        $this->logActivity('category.deleted', 'category', $id);
        $this->repo->delete($id);
        return $this->successResponse(null, 'Category deleted');
    }
}

