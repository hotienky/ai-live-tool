<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\CmsPage\CmsPageRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use App\Events\ContentSaved;
use App\Events\ContentDeleted;
use App\Events\PagePublished;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CmsPagesController extends Controller
{
    use ApiResponse, LogsActivity, \App\Traits\HasContentTranslations;

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

    /** Tìm trang theo alias — dùng cho storefront và page builder */
    public function showByAlias($alias)
    {
        $page = $this->repo->findByAlias($alias);
        return $page ? $this->successResponse($page) : $this->notFoundResponse('Page not found');
    }

    /** Lấy danh sách trang hệ thống (home, about, contact) */
    public function systemPages()
    {
        try {
            $pages = $this->repo->getSystemPages();
            return $this->successResponse($pages);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /** Lưu layout_data cho trang dynamic — tách khỏi update chính để tránh mất data content */
    public function saveLayout(Request $request, $id)
    {
        try {
            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');

            $data = $request->validate([
                'layout_data' => 'required|array',
                'is_dynamic'  => 'nullable|boolean',
            ]);

            $update = ['layout_data' => $data['layout_data']];
            if (isset($data['is_dynamic'])) {
                $update['is_dynamic'] = $data['is_dynamic'];
            }

            $this->repo->update($update, $id);
            $this->logActivity('cms.layout_saved', 'cms_page', $id, ['title' => $page->title ?? null]);

            ContentSaved::dispatch('page', (int) $id, $update, false);

            return $this->successResponse($this->repo->find($id), 'Layout saved');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
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
                'sort' => 'nullable|integer',
                'status' => 'nullable',
                'is_active' => 'nullable|boolean',
                'published_at' => 'nullable|date',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string',
                'meta_keywords' => 'nullable|string',
                'is_dynamic' => 'nullable|boolean',
                'layout_data' => 'nullable|array',
            ]);
            // Convert status to boolean for DB
            if (isset($data['status'])) {
                $data['status'] = filter_var($data['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
            }
            $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
            $data['alias'] = $data['alias'] ?? $data['slug'];
            $data['status'] = $data['status'] ?? true;
            $page = $this->repo->store($data);
            $this->logActivity('cms.created', 'cms_page', $page->id, ['title' => $data['title']]);

            if ($request->has('translations')) {
                $this->syncTranslations('cms_pages', $page->id, $request->input('translations'));
            }

            // Fire event for plugins
            ContentSaved::dispatch('page', $page->id, $data, true);

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
                'sort' => 'nullable|integer',
                'status' => 'nullable',
                'is_active' => 'nullable|boolean',
                'published_at' => 'nullable|date',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string',
                'meta_keywords' => 'nullable|string',
                'is_dynamic' => 'nullable|boolean',
                'layout_data' => 'nullable|array',
            ]);
            // Convert status to boolean for DB
            if (isset($data['status'])) {
                $data['status'] = filter_var($data['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
            }

            $page = $this->repo->find($id);
            if (!$page) return $this->notFoundResponse('Page not found');
            $this->repo->update($data, $id);
            $this->logActivity('cms.updated', 'cms_page', $id, ['title' => $data['title'] ?? null]);

            if ($request->has('translations')) {
                $this->syncTranslations('cms_pages', $id, $request->input('translations'));
            }

            // Fire event for plugins
            ContentSaved::dispatch('page', (int) $id, $data, false);

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
            $this->logActivity('cms.deleted', 'cms_page', $id, ['title' => $page->title ?? null]);
            $this->repo->delete($id);

            // Fire event for plugins
            ContentDeleted::dispatch('page', (int) $id);

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
            $this->logActivity('cms.published', 'cms_page', $id, ['title' => $page->title ?? null]);

            // Fire event for plugins
            PagePublished::dispatch((int) $id, $page->title ?? null, auth()->id());

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

