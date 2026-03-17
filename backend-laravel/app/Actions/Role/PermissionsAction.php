<?php
namespace App\Actions\Role;

class PermissionsAction extends BaseAction
{
    public function __invoke() { return $this->successResponse($this->repo->getAllPermissions()); }
}
