<?php

namespace App\Services\Payment;

use App\Models\BillingInvoice;
use Illuminate\Support\Facades\Log;

class StripeGateway implements PaymentGateway
{
    public function createPaymentUrl(BillingInvoice $invoice, string $returnUrl): string
    {
        Log::info("[Stripe] Creating checkout session for invoice #{$invoice->id}");
        // Mock Stripe Checkout URL
        return "https://checkout.stripe.com/pay/cs_test_mock?order={$invoice->id}";
    }

    public function verifyCallback(array $data): bool
    {
        Log::info("[Stripe] Verifying webhook payload", $data);
        return true;
    }
}
