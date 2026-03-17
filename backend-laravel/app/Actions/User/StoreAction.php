<?php
namespace App\Actions\User;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'role_id'  => 'nullable|integer|exists:roles,id',
                'is_active'=> 'nullable|boolean',
            ]);

            $user = $this->repo->storeStaff($data);
            $this->logActivity('user.created', 'user', $user->id, ['name' => $data['name'], 'email' => $data['email']]);

            return $this->successResponse($user, 'Đã tạo người dùng', 201);
        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
