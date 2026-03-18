<?php

namespace App\Services;

use App\Models\AccountingEntry;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\SystemConfig;

class AccountingService
{
    /**
     * Auto-generate accounting entries when an order is delivered
     */
    public function onOrderDelivered(Order $order): void
    {
        // Revenue entry
        AccountingEntry::create([
            'type' => 'revenue',
            'category' => 'order_revenue',
            'amount' => $order->total_amount,
            'tax_amount' => $order->tax_amount ?? 0,
            'description' => "Đơn hàng #{$order->order_number} - Doanh thu",
            'reference_type' => 'order',
            'reference_id' => $order->id,
            'entry_date' => now()->toDateString(),
        ]);

        // Shipping cost as expense (if any)
        if (($order->shipping_fee ?? 0) > 0) {
            AccountingEntry::create([
                'type' => 'expense',
                'category' => 'shipping_cost',
                'amount' => $order->shipping_fee,
                'description' => "Đơn hàng #{$order->order_number} - Phí vận chuyển",
                'reference_type' => 'order',
                'reference_id' => $order->id,
                'entry_date' => now()->toDateString(),
            ]);
        }

        // Auto-generate invoice
        $config = $this->getAccountingConfig();
        $invoice = $this->createInvoiceFromOrder($order, $config);

        // Auto-send invoice email if enabled and customer has email
        if ($config['auto_email'] === 'true' && $order->customer_email) {
            try {
                $mail = new \App\Mail\InvoiceMail($invoice);
                $mail->footerText = $config['footer_text'] ?? 'Cảm ơn quý khách!';
                \Illuminate\Support\Facades\Mail::to($order->customer_email)
                    ->send($mail);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Invoice email failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Auto-generate accounting entry when an order is returned/refunded
     */
    public function onOrderReturned(Order $order): void
    {
        AccountingEntry::create([
            'type' => 'adjustment',
            'category' => 'refund',
            'amount' => -$order->total_amount,
            'tax_amount' => -($order->tax_amount ?? 0),
            'description' => "Đơn hàng #{$order->order_number} - Hoàn trả",
            'reference_type' => 'order',
            'reference_id' => $order->id,
            'entry_date' => now()->toDateString(),
        ]);

        // Cancel the invoice if exists
        Invoice::where('order_id', $order->id)
            ->where('status', '!=', 'cancelled')
            ->update(['status' => 'cancelled']);
    }

    /**
     * Create an invoice from an order
     */
    public function createInvoiceFromOrder(Order $order, ?array $config = null): Invoice
    {
        $config = $config ?? $this->getAccountingConfig();
        $prefix = $config['invoice_prefix'] ?? 'INV';
        $paymentTerms = (int) ($config['payment_terms'] ?? 0);

        return Invoice::create([
            'invoice_number' => Invoice::generateNumber($prefix),
            'order_id' => $order->id,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'customer_address' => $order->customer_address,
            'customer_email' => $order->customer_email,
            'items' => $order->items,
            'subtotal' => $order->subtotal ?? $order->total_amount,
            'tax_amount' => $order->tax_amount ?? 0,
            'tax_details' => $order->tax_details,
            'discount_amount' => $order->discount_amount ?? 0,
            'shipping_fee' => $order->shipping_fee ?? 0,
            'total_amount' => $order->total_amount,
            'status' => 'issued',
            'issued_at' => now(),
            'due_date' => $paymentTerms > 0 ? now()->addDays($paymentTerms) : null,
        ]);
    }

    /**
     * Get accounting config from system_configs
     */
    public function getAccountingConfig(): array
    {
        $defaults = [
            'auto_email' => 'true',
            'invoice_prefix' => 'INV',
            'payment_terms' => '0',
            'tax_label' => 'VAT',
            'footer_text' => 'Cảm ơn quý khách!',
            'custom_categories' => '[]',
            'seller_name' => '',
            'seller_phone' => '',
            'seller_email' => '',
            'seller_address' => '',
            'seller_tax_id' => '',
        ];

        try {
            $configs = SystemConfig::where('group', 'accounting')->get();
            foreach ($configs as $c) {
                if (array_key_exists($c->key, $defaults)) {
                    $defaults[$c->key] = $c->value;
                }
            }
        } catch (\Exception $e) { /* silent */ }

        return $defaults;
    }

    /**
     * Summary: total revenue, expenses, profit, tax for a period
     */
    public function getSummary(?string $from = null, ?string $to = null): array
    {
        $query = AccountingEntry::query();
        if ($from) $query->where('entry_date', '>=', $from);
        if ($to) $query->where('entry_date', '<=', $to);

        $entries = $query->get();

        $revenue = $entries->where('type', 'revenue')->sum('amount');
        $expenses = $entries->where('type', 'expense')->sum('amount');
        $adjustments = $entries->where('type', 'adjustment')->sum('amount');
        $taxCollected = $entries->where('type', 'revenue')->sum('tax_amount');
        $taxRefunded = $entries->where('type', 'adjustment')->sum('tax_amount');

        return [
            'revenue' => round($revenue, 2),
            'expenses' => round($expenses, 2),
            'adjustments' => round($adjustments, 2),
            'profit' => round($revenue + $adjustments - $expenses, 2),
            'tax_collected' => round($taxCollected, 2),
            'tax_refunded' => round(abs($taxRefunded), 2),
            'tax_payable' => round($taxCollected + $taxRefunded, 2),
        ];
    }

    /**
     * Monthly breakdown for charts
     */
    public function getMonthlyBreakdown(int $year): array
    {
        $entries = AccountingEntry::whereYear('entry_date', $year)->get();
        $months = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthly = $entries->filter(fn($e) => (int) $e->entry_date->format('n') === $m);
            $months[] = [
                'month' => $m,
                'revenue' => round($monthly->where('type', 'revenue')->sum('amount'), 2),
                'expenses' => round($monthly->where('type', 'expense')->sum('amount'), 2),
                'tax' => round($monthly->where('type', 'revenue')->sum('tax_amount'), 2),
            ];
        }

        return $months;
    }

    /**
     * Tax report by month for a given year
     */
    public function getTaxReport(int $year): array
    {
        $entries = AccountingEntry::whereYear('entry_date', $year)->get();
        $report = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthly = $entries->filter(fn($e) => (int) $e->entry_date->format('n') === $m);
            $revenue = $monthly->where('type', 'revenue');
            $adjustments = $monthly->where('type', 'adjustment');

            $report[] = [
                'month' => $m,
                'total_sales' => round($revenue->sum('amount'), 2),
                'tax_collected' => round($revenue->sum('tax_amount'), 2),
                'tax_refunded' => round(abs($adjustments->sum('tax_amount')), 2),
                'tax_payable' => round($revenue->sum('tax_amount') + $adjustments->sum('tax_amount'), 2),
                'order_count' => $revenue->where('category', 'order_revenue')->count(),
                'refund_count' => $adjustments->where('category', 'refund')->count(),
            ];
        }

        return $report;
    }
}
