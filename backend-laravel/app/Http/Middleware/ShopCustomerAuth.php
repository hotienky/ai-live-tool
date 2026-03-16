<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Middleware to authenticate shop customers via Bearer token.
 * Looks up token in shop_customer_tokens table and sets shop_customer on request.
 */
class ShopCustomerAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'type' => 'error',
                'message' => 'Vui lòng đăng nhập',
                'code' => 401,
            ], 401);
        }

        $hashedToken = hash('sha256', $token);
        $record = DB::table('shop_customer_tokens')
            ->where('token', $hashedToken)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$record) {
            return response()->json([
                'type' => 'error',
                'message' => 'Phiên đăng nhập hết hạn',
                'code' => 401,
            ], 401);
        }

        $customer = DB::table('shop_customers')->find($record->customer_id);
        if (!$customer) {
            return response()->json([
                'type' => 'error',
                'message' => 'Tài khoản không tồn tại',
                'code' => 401,
            ], 401);
        }

        $request->attributes->set('shop_customer', $customer);
        return $next($request);
    }
}
