<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\NavLink\NavLinkRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class NavLinksController extends Controller
{
    use ApiResponse;

    public function __construct(private NavLinkRepositoryInterface $repo) {}

    public function index()
    {
        $all = $this->repo->all();
        // Transform to frontend format and nest children under collections
        $mapped = $all->map(fn($link) => [
            'id' => $link->id,
            'name' => $link->title ?? '',
            'url' => $link->url ?? '#',
            'group' => $link->group ?? 'menu',
            'type' => $link->type ?? 'single',
            'sort' => $link->sort_order ?? 0,
            'parent_id' => $link->parent_id,
            'target' => $link->target ?? '_self',
            'icon' => $link->icon ?? '',
            'is_active' => $link->is_active ?? true,
            'collectionId' => $link->parent_id,
        ]);

        // Nest children under parent collections
        $parents = $mapped->whereNull('parent_id')->values();
        return $this->successResponse($parents->map(function ($p) use ($mapped) {
            $p['children'] = $mapped->where('parent_id', $p['id'])->values()->all();
            return $p;
        }));
    }

    public function store(Request $request)
    {
        try {
            // Accept both frontend field names (name, sort, collectionId) and standard names (label, sort_order, parent_id)
            $title = $request->input('name') ?? $request->input('label') ?? $request->input('title');
            if (!$title) {
                return $this->errorResponse('Tên liên kết là bắt buộc', 422);
            }

            $data = [
                'title' => $title,
                'url' => $request->input('url', '#'),
                'group' => $request->input('group', 'menu'),
                'type' => $request->input('type', 'single'),
                'sort_order' => $request->input('sort') ?? $request->input('sort_order', 0),
                'parent_id' => $request->input('collectionId') ?? $request->input('parent_id'),
                'target' => $request->input('target', '_self'),
                'icon' => $request->input('icon', ''),
                'is_active' => $request->input('is_active', true),
            ];

            $navLink = $this->repo->store($data);
            return $this->successResponse($navLink, 'Nav link created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $link = $this->repo->find($id);
            if (!$link) return $this->notFoundResponse('Nav link not found');

            // Map frontend field names to DB columns
            $data = $request->all();
            if (isset($data['name'])) { $data['title'] = $data['name']; unset($data['name']); }
            if (isset($data['sort'])) { $data['sort_order'] = $data['sort']; unset($data['sort']); }
            if (array_key_exists('collectionId', $data)) { $data['parent_id'] = $data['collectionId']; unset($data['collectionId']); }

            $this->repo->update($data, $id);
            return $this->successResponse($this->repo->find($id), 'Nav link updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $link = $this->repo->find($id);
            if (!$link) return $this->notFoundResponse('Nav link not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Nav link deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function reorder(Request $request)
    {
        try {
            $this->repo->reorder($request->input('items', []));
            return $this->successResponse(null, 'Nav links reordered');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function flat()
    {
        $links = $this->repo->all();
        return $this->successResponse($links->map(function ($link) {
            return [
                'id' => $link->id,
                'name' => $link->title ?? '',
                'label' => $link->title ?? '',
                'url' => $link->url,
                'group' => $link->group ?? 'menu',
                'type' => $link->type ?? 'single',
                'sort' => $link->sort_order ?? 0,
                'sort_order' => $link->sort_order ?? 0,
                'parent_id' => $link->parent_id,
                'target' => $link->target ?? '_self',
                'icon' => $link->icon ?? '',
                'is_active' => $link->is_active ?? true,
            ];
        }));
    }
}
