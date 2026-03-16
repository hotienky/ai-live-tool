<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


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
        try {
            return $this->successResponse($this->repo->all());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function show($id)
    {
        $page = $this->repo->find($id);
        return $page ? $this->successResponse($page) : $this->notFoundResponse('Page not found');
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string',
                'alias' => 'nullable|string',
                'content' => 'nullable|string',
                'image' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'status' => 'nullable|string|in:draft,published,scheduled',
                'published_at' => 'nullable|date',
                'meta_description' => 'nullable|string',
                'meta_keywords' => 'nullable|string',
                'is_dynamic' => 'nullable|boolean',
                'layout_data' => 'nullable|array',
            ]);
            $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
            $data['alias'] = $data['alias'] ?? $data['slug'];
            $data['status'] = $data['status'] ?? 'draft';
            $page = $this->repo->store($data);
            return $this->successResponse($page, 'Page created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'title' => 'nullable|string|max:255',
                'slug' => 'nullable|string',
                'alias' => 'nullable|string',
                'content' => 'nullable|string',
                'image' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'status' => 'nullable|string|in:draft,published,scheduled',
                'published_at' => 'nullable|date',
                'meta_description' => 'nullable|string',
                'meta_keywords' => 'nullable|string',
                'is_dynamic' => 'nullable|boolean',
                'layout_data' => 'nullable|array',
            ]);

            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');
            $this->repo->update($data, $id);
            return $this->successResponse($this->repo->find($id), 'Page updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Page deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    // Publishing workflow
    public function publish($id)
    {
        try {
            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');
            $this->repo->update(['status' => 'published', 'published_at' => now(), 'is_active' => true], $id);
            return $this->successResponse($this->repo->find($id), 'Page published');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function unpublish($id)
    {
        try {
            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');
            $this->repo->update(['status' => 'draft', 'is_active' => false], $id);
            return $this->successResponse($this->repo->find($id), 'Page unpublished');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function schedule(Request $request, $id)
    {
        try {
            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');
            $data = $request->validate(['published_at' => 'required|date|after:now']);
            $this->repo->update(['status' => 'scheduled', 'published_at' => $data['published_at']], $id);
            return $this->successResponse($this->repo->find($id), 'Page scheduled');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

