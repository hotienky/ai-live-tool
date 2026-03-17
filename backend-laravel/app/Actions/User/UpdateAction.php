<?php
namespace App\Actions\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        try {
            $data = $request->validate([
                'name'      => 'sometimes|string|max:255',
                'email'     => "sometimes|email|unique:users,email,{$id}",
                'password'  => 'sometimes|string|min:6',
                'role_id'   => 'sometimes|nullable|integer|exists:roles,id',
                'is_active' => 'sometimes|boolean',
            ]);

            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            $data['updated_at'] = now();
            $this->repo->update($data, $id);
            $this->logActivity('user.updated', 'user', $id, array_diff_key($data, ['password' => 1, 'updated_at' => 1]));

            // Sync role if provided
            if (array_key_exists('role_id', $data)) {
                $this->repo->syncRole($id, $data['role_id']);
            }

            $user = $this->repo->findWithRole($id);
            return $this->successResponse($user, 'Đã cập nhật người dùng');
        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
