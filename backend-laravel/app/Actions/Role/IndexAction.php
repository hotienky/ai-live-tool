<?php
namespace App\Actions\Role;

class IndexAction extends BaseAction
{
    public function __invoke() { return $this->successResponse($this->repo->all()); }
}
