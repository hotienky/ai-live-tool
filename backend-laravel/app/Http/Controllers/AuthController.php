<?php

namespace App\Http\Controllers;

use App\Repositories\User\UserRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private UserRepositoryInterface $userRepo) {}

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

            $token = Str::random(64);
            DB::table('auth_access_tokens')->insert([
                'tokenable_id' => $user->id,
                'type' => 'auth_token',
                'name' => 'API Token',
                'hash' => hash('sha256', $token),
                'created_at' => now(),
                'updated_at' => now(),
                'expires_at' => now()->addDays(30),
            ]);

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

            $token = Str::random(64);
            DB::table('auth_access_tokens')->insert([
                'tokenable_id' => $user->id,
                'type' => 'auth_token',
                'name' => 'API Token',
                'hash' => hash('sha256', $token),
                'created_at' => now(),
                'updated_at' => now(),
                'expires_at' => now()->addDays(30),
            ]);

            $this->userRepo->update(['last_login_at' => now()], $user->id);

            unset($user->password);
            return $this->successResponse([
                'user' => $user,
                'token' => $token,
            ], 'Login successful');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function me(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        return $this->successResponse($user);
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
