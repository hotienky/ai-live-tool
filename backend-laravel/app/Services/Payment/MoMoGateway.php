<?php

namespace App\Services\Payment;

use App\Models\BillingInvoice;
use Illuminate\Support\Facades\Log;

class MoMoGateway implements PaymentGateway
{
    public function createPaymentUrl(BillingInvoice $invoice, string $returnUrl): string
    {
        Log::info("[MoMo] Creating payment URL for invoice #{$invoice->id}");
        // Mock returning a MoMo Sandbox URL
        return "https://test-payment.momo.vn/v2/gateway/pay?orderId={$invoice->id}&amount={$invoice->amount}&redirectUrl=" . urlencode($returnUrl);
    }

    public function verifyCallback(array $data): bool
    {
        Log::info("[MoMo] Verifying callback data", $data);
        // Mock verification
        return isset($data['resultCode']) && $data['resultCode'] == '0';
    }
}
