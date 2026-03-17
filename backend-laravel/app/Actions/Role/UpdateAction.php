<?php
namespace App\Actions\Role;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'display_name' => 'sometimes|string|max:255',
        ]);

        $data = array_filter($request->only(['name', 'display_name', 'description']), fn($v) => $v !== null);
        if (!empty($data)) {
            $this->repo->update($data, $id);
        }
        if ($request->has('permissions')) {
            $this->repo->syncPermissions($id, $request->input('permissions', []));
        }
        $this->logActivity('role.updated', 'role', $id);
        return $this->successResponse($this->repo->findWithPermissions($id), 'Role updated');
    }
}
