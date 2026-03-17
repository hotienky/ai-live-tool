<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Manages tenant CMS staff users (create / list / update / delete / assign role).
 * All endpoints require permission:system.users.
 */
class UserController extends Controller
{
    use ApiResponse, LogsActivity;

    /** List all tenant users with their current role */
    public function index()
    {
        $users = DB::table('users')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->select(
                'users.id', 'users.name', 'users.email',
                'users.is_active', 'users.created_at',
                'users.role_id',
                'roles.name as role_name',
                'roles.display_name as role_display_name'
            )
            ->orderByDesc('users.created_at')
            ->get();

        return $this->successResponse($users);
    }

    /** Create a new staff user */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'role_id'  => 'nullable|integer|exists:roles,id',
                'is_active'=> 'nullable|boolean',
            ]);

            $userId = DB::table('users')->insertGetId([
                'name'       => $data['name'],
                'email'      => $data['email'],
                'password'   => Hash::make($data['password']),
                'role_id'    => $data['role_id'] ?? null,
                'is_active'  => $data['is_active'] ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Also sync to user_roles pivot
            if (!empty($data['role_id'])) {
                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $userId],
                    ['role_id' => $data['role_id']]
                );
            }

            $user = DB::table('users')
                ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
                ->where('users.id', $userId)
                ->select('users.*', 'roles.name as role_name', 'roles.display_name as role_display_name')
                ->first();

            $this->logActivity('user.created', 'user', $userId, ['name' => $data['name'], 'email' => $data['email']]);
            return $this->successResponse($user, 'Đã tạo người dùng', 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /** Get single user */
    public function show($id)
    {
        $user = DB::table('users')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->where('users.id', $id)
            ->select('users.*', 'roles.name as role_name', 'roles.display_name as role_display_name')
            ->first();

        if (!$user) return $this->notFoundResponse('Người dùng không tồn tại');
        return $this->successResponse($user);
    }

    /** Update user profile (name, email, password, role, active status) */
    public function update(Request $request, $id)
    {
        try {
            $rules = [
                'name'      => 'sometimes|string|max:255',
                'email'     => "sometimes|email|unique:users,email,{$id}",
                'password'  => 'sometimes|string|min:6',
                'role_id'   => 'sometimes|nullable|integer|exists:roles,id',
                'is_active' => 'sometimes|boolean',
            ];
            $data = $request->validate($rules);

            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            $data['updated_at'] = now();
            DB::table('users')->where('id', $id)->update($data);
            $this->logActivity('user.updated', 'user', $id, array_diff_key($data, ['password' => 1, 'updated_at' => 1]));

            // Sync role in user_roles pivot
            if (array_key_exists('role_id', $data)) {
                if ($data['role_id']) {
                    DB::table('user_roles')->updateOrInsert(
                        ['user_id' => $id],
                        ['role_id' => $data['role_id']]
                    );
                } else {
                    DB::table('user_roles')->where('user_id', $id)->delete();
                }
            }

            return $this->show($id);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /** Toggle active status */
    public function toggleActive($id)
    {
        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) return $this->notFoundResponse('Người dùng không tồn tại');

        DB::table('users')->where('id', $id)->update([
            'is_active'  => !$user->is_active,
            'updated_at' => now(),
        ]);

        return $this->successResponse(['is_active' => !$user->is_active], 'Đã cập nhật trạng thái');
    }

    /** Delete a user (cannot delete self) */
    public function destroy(Request $request, $id)
    {
        $authUser = $request->attributes->get('auth_user');
        if ($authUser && $authUser->id == $id) {
            return $this->errorResponse('Không thể xóa tài khoản đang đăng nhập', 403);
        }

        $this->logActivity('user.deleted', 'user', $id);
        DB::table('user_roles')->where('user_id', $id)->delete();
        DB::table('users')->where('id', $id)->delete();

        return $this->successResponse(null, 'Đã xóa người dùng');
    }
}
