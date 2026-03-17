<?php
namespace App\Actions\MasterUser;

use App\Repositories\MasterUser\MasterUserRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UpdateAction
{
    use ApiResponse;

    public function __construct(private MasterUserRepositoryInterface $repo) {}

    public function __invoke(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:master.master_users,email,' . $id,
                'password' => 'sometimes|string|min:6',
                'role_id' => 'sometimes|integer|exists:master.master_roles,id',
                'is_active' => 'sometimes|boolean',
            ]);

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $this->repo->update($data, $id);
            $user = $this->repo->query()->with('role')->find($id);

            return $this->successResponse($user, 'User updated');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
