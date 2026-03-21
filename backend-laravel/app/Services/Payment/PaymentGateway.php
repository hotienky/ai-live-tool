<?php

namespace App\Services\Payment;

use App\Models\BillingInvoice;

interface PaymentGateway
{
    /**
     * Create a payment request and return the redirect URL
     */
    public function createPaymentUrl(BillingInvoice $invoice, string $returnUrl): string;

    /**
     * Verify the payment response callback
     */
    public function verifyCallback(array $data): bool;
}
