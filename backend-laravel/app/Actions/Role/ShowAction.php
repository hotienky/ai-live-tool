<?php
namespace App\Actions\Role;

class ShowAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $role = $this->repo->findWithPermissions($id);
        if (!$role) return $this->notFoundResponse('Role not found');
        return $this->successResponse($role);
    }
}
