<?php
namespace App\Actions\MasterUser;

use App\Repositories\MasterUser\MasterUserRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StoreAction
{
    use ApiResponse;

    public function __construct(private MasterUserRepositoryInterface $repo) {}

    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:master.master_users,email',
                'password' => 'required|string|min:6',
                'role_id' => 'required|integer|exists:master.master_roles,id',
            ]);

            $data['password'] = Hash::make($data['password']);
            $data['is_active'] = true;

            $user = $this->repo->store($data);
            $user = $this->repo->query()->with('role')->find($user->id);

            return $this->successResponse($user, 'User created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
