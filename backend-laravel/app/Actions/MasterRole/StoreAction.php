<?php
namespace App\Actions\MasterRole;

use App\Repositories\MasterRole\MasterRoleRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class StoreAction
{
    use ApiResponse;

    public function __construct(private MasterRoleRepositoryInterface $repo) {}

    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:50|unique:master.master_roles,name',
                'display_name' => 'required|string|max:100',
                'permissions' => 'required|array',
            ]);

            $role = $this->repo->store($data);
            return $this->successResponse($role, 'Role created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
