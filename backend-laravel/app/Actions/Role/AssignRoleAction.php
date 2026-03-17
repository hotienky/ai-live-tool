<?php
namespace App\Actions\Role;

use Illuminate\Http\Request;

class AssignRoleAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $data = $request->validate(['role_id' => 'required|integer']);
        $this->repo->assignRoleToUser($id, $data['role_id']);
        return $this->successResponse(null, 'Role assigned');
    }
}
