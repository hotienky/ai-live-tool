<?php

namespace App\Http\Controllers;

use App\Repositories\Role\RoleRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $role = $this->repo->find($id);
        if (!$role) return $this->notFoundResponse('Role not found');

        $permissions = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $id)
            ->select('permissions.*')
            ->get();

        $role->permissions = $permissions;
        return $this->successResponse($role);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate(['name' => 'required|string', 'description' => 'nullable|string']);
            $role = $this->repo->store($data);
            return $this->successResponse($role, 'Role created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->only(['name', 'description']), $id);
        return $this->successResponse($this->repo->find($id), 'Role updated');
    }

    public function destroy($id)
    {
        DB::table('role_permissions')->where('role_id', $id)->delete();
        DB::table('user_roles')->where('role_id', $id)->delete();
        $this->repo->delete($id);
        return $this->successResponse(null, 'Role deleted');
    }

    public function permissions()
    {
        return $this->successResponse(DB::table('permissions')->get());
    }

    public function updatePermissions(Request $request, $id)
    {
        $permissionIds = $request->input('permissions', []);
        DB::table('role_permissions')->where('role_id', $id)->delete();
        foreach ($permissionIds as $pid) {
            DB::table('role_permissions')->insert(['role_id' => $id, 'permission_id' => $pid]);
        }
        return $this->successResponse(null, 'Permissions updated');
    }

    public function assignRole(Request $request)
    {
        $data = $request->validate(['user_id' => 'required|integer', 'role_id' => 'required|integer']);
        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $data['user_id']],
            ['role_id' => $data['role_id']]
        );
        return $this->successResponse(null, 'Role assigned');
    }
}
