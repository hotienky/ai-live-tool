<?php
namespace App\Actions\Role;

class UsersAction extends BaseAction
{
    public function __invoke() { return $this->successResponse($this->repo->getUsers()); }
}
