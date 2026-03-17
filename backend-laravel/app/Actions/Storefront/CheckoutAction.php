<?php
namespace App\Actions\Storefront;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckoutAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'customer_name' => 'required|string',
                'customer_phone' => 'required|string',
                'customer_address' => 'required|string',
                'customer_email' => 'nullable|email',
                'payment_method' => 'nullable|string',
                'notes' => 'nullable|string',
                'items' => 'required|array',
                'shipping_provider' => 'nullable|string',
                'shipping_service' => 'nullable|string',
                'shipping_fee' => 'nullable|numeric',
                'to_province_id' => 'nullable|integer',
                'to_district_id' => 'nullable|integer',
                'to_ward_code' => 'nullable|string',
            ]);

            $paymentMethod = $data['payment_method'] ?? 'cod';
            $subtotal = collect($data['items'])->reduce(
                fn($sum, $i) => $sum + (floatval($i['price'] ?? 0) * intval($i['qty'] ?? 1)), 0
            );

            // Coupon processing
            $couponCode = $request->input('coupon_code');
            $discountAmount = 0;
            if ($couponCode) {
                $couponResult = $this->couponRepo->validateCoupon($couponCode, $subtotal);
                if ($couponResult['valid']) {
                    $discountAmount = min($couponResult['discount'], $subtotal);
                    $couponResult['coupon']->increment('used_count');
                }
            }

            $shippingFee = floatval($data['shipping_fee'] ?? 0);
            $totalAmount = $subtotal - $discountAmount + $shippingFee;

            $order = $this->orderRepo->store([
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_address' => $data['customer_address'],
                'customer_email' => $data['customer_email'] ?? null,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentMethod === 'bank' ? 'unpaid' : 'pending',
                'notes' => $data['notes'] ?? null,
                'items' => json_encode($data['items']),
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'shipping_fee' => $shippingFee,
                'coupon_code' => $discountAmount > 0 ? $couponCode : null,
                'shipping_provider' => $data['shipping_provider'] ?? null,
                'shipping_service' => $data['shipping_service'] ?? null,
                'to_province_id' => $data['to_province_id'] ?? null,
                'to_district_id' => $data['to_district_id'] ?? null,
                'to_ward_code' => $data['to_ward_code'] ?? null,
                'status' => 'pending',
            ]);

            $this->orderRepo->createOrderDetails($order->id, $data['items']);

            $response = $order->toArray();
            $bankInfo = null;
            if ($paymentMethod === 'bank') {
                $bankInfo = $this->getBankInfo($order->id);
                $response['bank_info'] = $bankInfo;
            }

            // Send order confirmation email
            $email = $data['customer_email'] ?? null;
            if ($email) {
                try {
                    Mail::to($email)->send(
                        new \App\Mail\OrderConfirmationMail($response, $data['items'], $bankInfo)
                    );
                } catch (\Exception $mailErr) {
                    Log::warning('Order email failed: ' . $mailErr->getMessage());
                }
            }

            return $this->successResponse($response, 'Order created successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
