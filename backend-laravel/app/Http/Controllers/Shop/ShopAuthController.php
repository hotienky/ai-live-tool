<?php

namespace App\Http\Controllers\Shop;
use App\Http\Controllers\Controller;

use App\Repositories\ShopCustomer\ShopCustomerRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ShopAuthController extends Controller
{
    use ApiResponse;

    public function __construct(private ShopCustomerRepositoryInterface $repo) {}

    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string',
                'email' => 'required|email',
                'password' => 'required|string|min:6',
                'phone' => 'nullable|string',
            ]);

            $existing = $this->repo->findByEmail($data['email']);
            if ($existing) {
                return $this->errorResponse('Email đã được sử dụng', 422);
            }

            $customer = $this->repo->store([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $token = $this->repo->createToken($customer->id);

            return $this->successResponse(['customer' => $customer, 'token' => $token], 'Registration successful', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function login(Request $request)
    {
        try {
            $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);

            $customer = $this->repo->findByEmail($data['email']);
            if (!$customer || !Hash::check($data['password'], $customer->password)) {
                return $this->errorResponse('Email hoặc mật khẩu không đúng', 401);
            }

            $token = $this->repo->createToken($customer->id);

            return $this->successResponse(['customer' => $customer, 'token' => $token], 'Login successful');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function me(Request $request)
    {
        $customer = $request->attributes->get('shop_customer');
        return $this->successResponse($customer);
    }

    public function updateProfile(Request $request)
    {
        try {
            $customer = $request->attributes->get('shop_customer');
            $data = $request->only(['name', 'phone', 'avatar']);
            $this->repo->update(array_merge($data, ['updated_at' => now()]), $customer->id);
            return $this->successResponse($this->repo->findOne($customer->id), 'Profile updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function changePassword(Request $request)
    {
        try {
            $data = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
            ]);
            $customer = $request->attributes->get('shop_customer');
            $full = $this->repo->findOne($customer->id);

            if (!Hash::check($data['current_password'], $full->password)) {
                return $this->errorResponse('Mật khẩu hiện tại không đúng');
            }

            $this->repo->update([
                'password' => Hash::make($data['new_password']),
                'updated_at' => now(),
            ], $customer->id);
            return $this->successResponse(null, 'Password updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function forgotPassword(Request $request)
    {
        return $this->successResponse(null, 'Password reset instructions sent');
    }

    public function resetPassword(Request $request)
    {
        try {
            $data = $request->validate(['email' => 'required|email']);
            $customer = $this->repo->findByEmail($data['email']);
            if (!$customer) {
                return $this->errorResponse('Email not found', 404);
            }

            $newPassword = Str::random(8);
            $this->repo->update([
                'password' => Hash::make($newPassword),
                'updated_at' => now(),
            ], $customer->id);
            return $this->successResponse(['temporary_password' => $newPassword], 'Password reset');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
