<?php
namespace App\Actions\MasterRole;

use App\Repositories\MasterRole\MasterRoleRepositoryInterface;
use App\Traits\ApiResponse;

class DestroyAction
{
    use ApiResponse;

    public function __construct(private MasterRoleRepositoryInterface $repo) {}

    public function __invoke($id)
    {
        try {
            $role = $this->repo->findOne($id);
            if (!$role) {
                return $this->errorResponse('Role not found', 404);
            }

            // Prevent deleting super_admin
            if ($role->name === 'super_admin') {
                return $this->errorResponse('Cannot delete super_admin role', 403);
            }

            $this->repo->delete($id);
            return $this->successResponse(null, 'Role deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
