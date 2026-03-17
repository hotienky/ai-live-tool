<?php
namespace App\Actions\MasterRole;

use App\Repositories\MasterRole\MasterRoleRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class UpdateAction
{
    use ApiResponse;

    public function __construct(private MasterRoleRepositoryInterface $repo) {}

    public function __invoke(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'display_name' => 'sometimes|string|max:100',
                'permissions' => 'sometimes|array',
            ]);

            $this->repo->update($data, $id);
            $role = $this->repo->findOne($id);
            return $this->successResponse($role, 'Role updated');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
