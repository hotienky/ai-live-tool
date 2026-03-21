<?php

namespace App\Services\Payment;

use App\Models\BillingInvoice;
use Illuminate\Support\Facades\Log;

class VnPayGateway implements PaymentGateway
{
    public function createPaymentUrl(BillingInvoice $invoice, string $returnUrl): string
    {
        Log::info("[VNPay] Creating payment URL for invoice #{$invoice->id}");
        // Mock returning a VNPay Sandbox URL
        return "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=" . ($invoice->amount * 100) . "&vnp_TxnRef={$invoice->id}&vnp_ReturnUrl=" . urlencode($returnUrl);
    }

    public function verifyCallback(array $data): bool
    {
        Log::info("[VNPay] Verifying callback data", $data);
        // Mock verification
        // In reality: Check hash signature (vnp_SecureHash)
        return isset($data['vnp_ResponseCode']) && $data['vnp_ResponseCode'] == '00';
    }
}
