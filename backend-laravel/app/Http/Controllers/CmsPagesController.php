<?php

namespace App\Http\Controllers;

use App\Repositories\CmsPage\CmsPageRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CmsPagesController extends Controller
{
    use ApiResponse;

    public function __construct(private CmsPageRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $page = $this->repo->find($id);
        return $page ? $this->successResponse($page) : $this->notFoundResponse('Page not found');
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate(['title' => 'required|string', 'slug' => 'nullable|string', 'content' => 'nullable|string', 'is_active' => 'nullable|boolean']);
            $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
            $page = $this->repo->store($data);
            return $this->successResponse($page, 'Page created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Page updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Page deleted');
    }
}
