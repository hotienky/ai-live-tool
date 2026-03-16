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
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'label' => 'required|string|max:255',
                'url' => 'required|string',
                'parent_id' => 'nullable|integer',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'target' => 'nullable|string|in:_self,_blank',
            ]);
            $navLink = $this->repo->store($data);
            return $this->successResponse($navLink, 'Nav link created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $link = $this->repo->find($id);
            if (!$link) return $this->notFoundResponse('Nav link not found');
            $this->repo->update($request->all(), $id);
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
                'label' => $link->label,
                'url' => $link->url,
                'parent_id' => $link->parent_id,
                'sort_order' => $link->sort_order ?? 0,
                'is_active' => $link->is_active ?? true,
            ];
        }));
    }
}
