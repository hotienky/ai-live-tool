<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\User\UserRepositoryInterface;
use App\Repositories\Role\RoleRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(
        private UserRepositoryInterface $userRepo,
        private RoleRepositoryInterface $roleRepo,
    ) {}

    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'full_name' => 'required|string',
                'email' => 'required|email',
                'password' => 'required|string|min:6',
            ]);

            $existing = $this->userRepo->findByEmail($data['email']);
            if ($existing) {
                return $this->errorResponse('Email đã được sử dụng', 422);
            }

            $user = $this->userRepo->store([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $token = $this->userRepo->createAccessToken($user->id);

            return $this->successResponse([
                'user' => $user,
                'token' => $token,
            ], 'Registration successful', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            $user = $this->userRepo->findByEmail($data['email']);
            if (!$user) {
                return $this->errorResponse('Email hoặc mật khẩu không đúng', 401);
            }

            // Handle both bcrypt (Laravel) and scrypt (AdonisJS legacy) password hashes
            $passwordValid = false;
            try {
                $passwordValid = Hash::check($data['password'], $user->password);
            } catch (\RuntimeException $e) {
                $passwordValid = password_verify($data['password'], $user->password);
            }

            if (!$passwordValid) {
                return $this->errorResponse('Email hoặc mật khẩu không đúng', 401);
            }

            if (!$user->is_active) {
                return $this->errorResponse('Tài khoản đã bị vô hiệu hóa', 403);
            }

            // Auto-rehash to bcrypt for future logins
            if (!str_starts_with($user->password, '$2y$') && !str_starts_with($user->password, '$2b$')) {
                $this->userRepo->update(['password' => Hash::make($data['password'])], $user->id);
            }

            $token = $this->userRepo->createAccessToken($user->id);
            $this->userRepo->update(['last_login_at' => now()], $user->id);
            $this->logActivity('user.login', 'user', $user->id, ['email' => $user->email]);

            unset($user->password);

            // Load RBAC
            $rbac = $this->loadUserRbac($user->id);
            $user->role = $rbac['role'];

            return $this->successResponse([
                'user' => $user,
                'permissions' => $rbac['permissions'],
                'token' => $token,
            ], 'Login successful');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function me(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $permissions = $request->attributes->get('user_permissions', []);
        return $this->successResponse([
            'user' => $user,
            'permissions' => $permissions,
        ]);
    }

    private function loadUserRbac(int $userId): array
    {
        try {
            // Try to get role from user_roles pivot first, then from users.role_id
            $roleId = DB::table('user_roles')->where('user_id', $userId)->value('role_id');
            if (!$roleId) {
                $roleId = DB::table('users')->where('id', $userId)->value('role_id');
            }

            if (!$roleId) {
                return ['role' => null, 'permissions' => []];
            }

            $roleData = $this->roleRepo->findWithPermissions($roleId);
            if (!$roleData) {
                return ['role' => null, 'permissions' => []];
            }

            $role = (object) [
                'id' => $roleData->id,
                'name' => $roleData->name,
                'display_name' => $roleData->display_name,
            ];

            // Check for wildcard permissions in JSON column
            $jsonPerms = json_decode($roleData->permissions ?? '[]', true);
            if (is_array($jsonPerms) && in_array('*', $jsonPerms)) {
                return ['role' => $role, 'permissions' => ['*']];
            }

            // Get permissions from pivot table
            $perms = $roleData->permission_names ?? [];
            return ['role' => $role, 'permissions' => $perms];
        } catch (\Exception $e) {
            // RBAC tables may not exist yet — degrade gracefully
            return ['role' => null, 'permissions' => ['*']];
        }
    }

    public function updateProfile(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->only(['full_name', 'email', 'phone', 'avatar']);
        $this->userRepo->update($data, $user->id);
        return $this->successResponse($this->userRepo->findOne($user->id));
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = $request->attributes->get('auth_user');
        $fullUser = $this->userRepo->findOne($user->id);

        $passwordValid = false;
        try {
            $passwordValid = Hash::check($request->input('current_password'), $fullUser->password);
        } catch (\RuntimeException $e) {
            $passwordValid = password_verify($request->input('current_password'), $fullUser->password);
        }

        if (!$passwordValid) {
            return $this->errorResponse('Mật khẩu hiện tại không đúng', 422);
        }

        $this->userRepo->update(['password' => Hash::make($request->input('new_password'))], $user->id);
        return $this->successResponse(null, 'Password changed successfully');
    }
}
