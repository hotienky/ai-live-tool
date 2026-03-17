<?php
namespace App\Actions\MasterUser;

use App\Repositories\MasterUser\MasterUserRepositoryInterface;
use App\Traits\ApiResponse;

class DestroyAction
{
    use ApiResponse;

    public function __construct(private MasterUserRepositoryInterface $repo) {}

    public function __invoke($id)
    {
        try {
            $user = $this->repo->findOne($id);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Prevent self-deletion
            $currentUser = request()->attributes->get('masterUser');
            if ($currentUser && $currentUser->id == $id) {
                return $this->errorResponse('Cannot delete your own account', 403);
            }

            $this->repo->delete($id);
            return $this->successResponse(null, 'User deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
