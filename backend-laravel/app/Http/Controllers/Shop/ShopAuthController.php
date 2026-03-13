<?php

namespace App\Http\Controllers\Shop;
use App\Http\Controllers\Controller;


use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ShopAuthController extends Controller
{
    use ApiResponse;

    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string',
                'email' => 'required|email',
                'password' => 'required|string|min:6',
                'phone' => 'nullable|string',
            ]);

            $existing = DB::table('shop_customers')->where('email', $data['email'])->first();
            if ($existing) {
                return $this->errorResponse('Email đã được sử dụng', 422);
            }

            $id = DB::table('shop_customers')->insertGetId([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $customer = DB::table('shop_customers')->where('id', $id)->first();
            $token = Str::random(64);

            DB::table('shop_customer_tokens')->insert([
                'customer_id' => $id,
                'token' => hash('sha256', $token),
                'expires_at' => now()->addDays(30),
                'created_at' => now(),
            ]);

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

            $customer = DB::table('shop_customers')->where('email', $data['email'])->first();
            if (!$customer || !Hash::check($data['password'], $customer->password)) {
                return $this->errorResponse('Email hoặc mật khẩu không đúng', 401);
            }

            $token = Str::random(64);
            DB::table('shop_customer_tokens')->insert([
                'customer_id' => $customer->id,
                'token' => hash('sha256', $token),
                'expires_at' => now()->addDays(30),
                'created_at' => now(),
            ]);

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
            DB::table('shop_customers')->where('id', $customer->id)->update(array_merge($data, ['updated_at' => now()]));
            return $this->successResponse(DB::table('shop_customers')->where('id', $customer->id)->first(), 'Profile updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function updatePassword(Request $request)
    {
        try {
            $data = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
            ]);
            $customer = $request->attributes->get('shop_customer');
            $full = DB::table('shop_customers')->where('id', $customer->id)->first();

            if (!Hash::check($data['current_password'], $full->password)) {
                return $this->errorResponse('Mật khẩu hiện tại không đúng');
            }

            DB::table('shop_customers')->where('id', $customer->id)->update([
                'password' => Hash::make($data['new_password']),
                'updated_at' => now(),
            ]);
            return $this->successResponse(null, 'Password updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function resetPassword(Request $request)
    {
        try {
            $data = $request->validate(['email' => 'required|email']);
            $customer = DB::table('shop_customers')->where('email', $data['email'])->first();
            if (!$customer) {
                return $this->errorResponse('Email not found', 404);
            }

            $newPassword = Str::random(8);
            DB::table('shop_customers')->where('id', $customer->id)->update([
                'password' => Hash::make($newPassword),
                'updated_at' => now(),
            ]);
            return $this->successResponse(['temporary_password' => $newPassword], 'Password reset');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
