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
                'name' => 'nullable|string',
                'first_name' => 'nullable|string',
                'last_name' => 'nullable|string',
                'firstName' => 'nullable|string',
                'lastName' => 'nullable|string',
                'email' => 'required|email',
                'password' => 'required|string|min:6',
                'phone' => 'nullable|string',
            ]);

            // Build name from firstName/lastName if name not provided
            $firstName = $data['first_name'] ?? $data['firstName'] ?? '';
            $lastName = $data['last_name'] ?? $data['lastName'] ?? '';
            $name = $data['name'] ?? trim("$firstName $lastName");
            if (empty($name)) {
                return $this->validationErrorResponse(['name' => ['The name field is required.']]);
            }

            $existing = $this->repo->findByEmail($data['email']);
            if ($existing) {
                return $this->errorResponse('Email đã được sử dụng', 422);
            }

            $customer = $this->repo->store([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'status' => 1,
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

    public function myOrders(Request $request)
    {
        $customer = $request->attributes->get('shop_customer');
        $orderRepo = app(\App\Repositories\Order\OrderRepositoryInterface::class);

        $orders = $orderRepo->query()
            ->where('customer_phone', $customer->phone)
            ->orWhere('customer_email', $customer->email)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        foreach ($orders as &$order) {
            $order->details = $orderRepo->getDetails($order->id);
        }

        return $this->successResponse($orders);
    }

    public function updateProfile(Request $request)
    {
        try {
            $customer = $request->attributes->get('shop_customer');
            $data = $request->only(['first_name', 'last_name', 'phone']);
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

    // ─── Address Management ───

    public function addresses(Request $request)
    {
        $customer = $request->attributes->get('shop_customer');
        return $this->successResponse($this->repo->getAddresses($customer->id));
    }

    public function createAddress(Request $request)
    {
        try {
            $customer = $request->attributes->get('shop_customer');
            $data = $request->validate([
                'first_name' => 'nullable|string',
                'last_name' => 'nullable|string',
                'phone' => 'nullable|string',
                'address1' => 'required|string',
                'address2' => 'nullable|string',
                'city' => 'nullable|string',
                'district' => 'nullable|string',
                'province' => 'nullable|string',
                'country' => 'nullable|string',
                'postcode' => 'nullable|string',
            ]);
            $addr = $this->repo->createAddress($customer->id, $data);
            return $this->successResponse($addr, 'Address created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function updateAddress(Request $request, $id)
    {
        try {
            $customer = $request->attributes->get('shop_customer');
            $data = $request->only(['first_name', 'last_name', 'phone', 'address1', 'address2', 'city', 'district', 'province', 'country', 'postcode']);
            $data['updated_at'] = now();
            $addr = $this->repo->updateAddress($customer->id, $id, $data);
            return $this->successResponse($addr, 'Address updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function deleteAddress(Request $request, $id)
    {
        try {
            $customer = $request->attributes->get('shop_customer');
            $this->repo->deleteAddress($customer->id, $id);
            return $this->successResponse(null, 'Address deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
