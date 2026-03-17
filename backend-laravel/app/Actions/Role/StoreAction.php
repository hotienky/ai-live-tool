<?php
namespace App\Actions\Role;

use Illuminate\Http\Request;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string',
                'display_name' => 'nullable|string',
                'description' => 'nullable|string',
            ]);
            $role = $this->repo->store($data);
            if ($request->has('permissions')) {
                $this->repo->syncPermissions($role->id, $request->input('permissions', []));
            }
            $this->logActivity('role.created', 'role', $role->id, ['name' => $data['name']]);
            return $this->successResponse($this->repo->findWithPermissions($role->id), 'Role created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
