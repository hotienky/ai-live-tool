<?php
namespace App\Actions\Role;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $this->repo->update($request->only(['name', 'display_name', 'description']), $id);
        if ($request->has('permissions')) {
            $this->repo->syncPermissions($id, $request->input('permissions', []));
        }
        $this->logActivity('role.updated', 'role', $id);
        return $this->successResponse($this->repo->findWithPermissions($id), 'Role updated');
    }
}
