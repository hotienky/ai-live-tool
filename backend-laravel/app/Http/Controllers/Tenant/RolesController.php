<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Role\RoleRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RolesController extends Controller
{
    use ApiResponse;

    public function __construct(private RoleRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $role = $this->repo->findWithPermissions($id);
        if (!$role) return $this->notFoundResponse('Role not found');
        return $this->successResponse($role);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate(['name' => 'required|string', 'display_name' => 'nullable|string', 'description' => 'nullable|string']);
            $role = $this->repo->store($data);
            if ($request->has('permissions')) {
                $this->repo->syncPermissions($role->id, $request->input('permissions', []));
            }
            return $this->successResponse($this->repo->findWithPermissions($role->id), 'Role created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->only(['name', 'display_name', 'description']), $id);
        if ($request->has('permissions')) {
            $this->repo->syncPermissions($id, $request->input('permissions', []));
        }
        return $this->successResponse($this->repo->findWithPermissions($id), 'Role updated');
    }

    public function destroy($id)
    {
        $this->repo->deleteWithRelations($id);
        return $this->successResponse(null, 'Role deleted');
    }

    public function permissions()
    {
        return $this->successResponse($this->repo->getAllPermissions());
    }

    public function users()
    {
        return $this->successResponse($this->repo->getUsers());
    }

    public function assignRole(Request $request, $id)
    {
        $data = $request->validate(['role_id' => 'required|integer']);
        $this->repo->assignRoleToUser($id, $data['role_id']);
        return $this->successResponse(null, 'Role assigned');
    }
}
