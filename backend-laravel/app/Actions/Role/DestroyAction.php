<?php
namespace App\Actions\Role;

class DestroyAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $this->logActivity('role.deleted', 'role', $id);
        $this->repo->deleteWithRelations($id);
        return $this->successResponse(null, 'Role deleted');
    }
}
