<?php

namespace App\Http\Controllers;

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
            $navLink = $this->repo->store($request->all());
            return $this->successResponse($navLink, 'Nav link created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Nav link updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Nav link deleted');
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
}
