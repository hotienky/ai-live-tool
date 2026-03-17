<?php
namespace App\Actions\MasterRole;

use App\Repositories\MasterRole\MasterRoleRepositoryInterface;
use App\Traits\ApiResponse;

class IndexAction
{
    use ApiResponse;

    public function __construct(private MasterRoleRepositoryInterface $repo) {}

    public function __invoke()
    {
        $roles = $this->repo->all();
        return $this->successResponse($roles);
    }
}
