<?php
namespace App\Actions\User;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        return $this->successResponse($this->repo->listWithRoles());
    }
}
