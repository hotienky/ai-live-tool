<?php

namespace App\Services;

use App\Models\AccountingEntry;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\StockReceipt;
use App\Models\SystemConfig;
use Carbon\Carbon;

class AccountingService
{
    /**
     * Auto-generate accounting entries when an order is delivered
     */
    public function onOrderDelivered(Order $order): void
    {
        // Prevent duplicate entries (e.g. delivered → completed)
        if (AccountingEntry::where('reference_type', 'order')
            ->where('reference_id', $order->id)
            ->where('category', 'order_revenue')
            ->exists()
        ) {
            return;
        }

        // Revenue entry
        AccountingEntry::create([
            'type' => 'revenue',
            'category' => 'order_revenue',
            'amount' => $order->total_amount,
            'tax_amount' => $order->tax_amount ?? 0,
            'description' => "Đơn hàng #{$order->id} - Doanh thu",
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
                'description' => "Đơn hàng #{$order->id} - Phí vận chuyển",
                'reference_type' => 'order',
                'reference_id' => $order->id,
                'entry_date' => now()->toDateString(),
            ]);
        }

        // COGS entry — calculate cost of goods sold
        $cogs = $this->calculateCOGS($order);
        if ($cogs > 0) {
            AccountingEntry::create([
                'type' => 'expense',
                'category' => 'cogs',
                'amount' => $cogs,
                'description' => "Đơn hàng #{$order->id} - Giá vốn hàng bán",
                'reference_type' => 'order',
                'reference_id' => $order->id,
                'entry_date' => now()->toDateString(),
            ]);
        }

        // Auto-create export stock receipt (phiếu xuất kho) to deduct stock
        $this->createExportReceiptFromOrder($order);

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
            'description' => "Đơn hàng #{$order->id} - Hoàn trả",
            'reference_type' => 'order',
            'reference_id' => $order->id,
            'entry_date' => now()->toDateString(),
        ]);

        // Cancel COGS entry for this order
        AccountingEntry::where('reference_type', 'order')
            ->where('reference_id', $order->id)
            ->where('category', 'cogs')
            ->delete();

        // Cancel the auto-created export stock receipt and restore stock
        $exportReceipt = StockReceipt::where('reference_type', 'order')
            ->where('reference_id', $order->id)
            ->where('type', 'export')
            ->where('status', 'confirmed')
            ->first();

        if ($exportReceipt) {
            // Restore stock for each item
            $items = $exportReceipt->items;
            if (is_array($items)) {
                foreach ($items as $item) {
                    $product = \App\Models\Product::find($item['product_id']);
                    if (!$product) continue;

                    $oldStock = $product->stock;
                    $product->stock += $item['qty'];
                    $product->save();

                    \Illuminate\Support\Facades\DB::table('stock_histories')->insert([
                        'product_id' => $product->id,
                        'action' => 'add',
                        'quantity_change' => $item['qty'],
                        'stock_before' => $oldStock,
                        'stock_after' => $product->stock,
                        'reason' => "Hoàn trả đơn hàng #{$order->id}",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            $exportReceipt->update(['status' => 'cancelled']);
        }

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
            'items' => $order->items ?? json_encode([]),
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
            'cogs' => round($entries->where('type', 'expense')->where('category', 'cogs')->sum('amount'), 2),
            'operating_expenses' => round($entries->where('type', 'expense')->where('category', '!=', 'cogs')->sum('amount'), 2),
            'adjustments' => round($adjustments, 2),
            'gross_profit' => round($revenue - $entries->where('type', 'expense')->where('category', 'cogs')->sum('amount'), 2),
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
            $monthly = $entries->filter(fn($e) => (int) Carbon::parse($e->entry_date)->format('n') === $m);
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
            $monthly = $entries->filter(fn($e) => (int) Carbon::parse($e->entry_date)->format('n') === $m);
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

    /**
     * Profit & Loss report — group by category within a period
     */
    public function getProfitLossReport(?string $from = null, ?string $to = null): array
    {
        $query = AccountingEntry::query();
        if ($from) $query->where('entry_date', '>=', $from);
        if ($to) $query->where('entry_date', '<=', $to);
        $entries = $query->get();

        $revenueItems = $entries->where('type', 'revenue');
        $expenseItems = $entries->where('type', 'expense');
        $adjustmentItems = $entries->where('type', 'adjustment');

        // Group revenue by category
        $revenueByCategory = [];
        foreach ($revenueItems->groupBy('category') as $cat => $items) {
            $revenueByCategory[] = [
                'category' => $cat,
                'amount' => round($items->sum('amount'), 2),
                'count' => $items->count(),
            ];
        }

        // Group expenses by category
        $expenseByCategory = [];
        foreach ($expenseItems->groupBy('category') as $cat => $items) {
            $expenseByCategory[] = [
                'category' => $cat,
                'amount' => round($items->sum('amount'), 2),
                'count' => $items->count(),
            ];
        }

        $totalRevenue = round($revenueItems->sum('amount'), 2);
        $totalExpenses = round($expenseItems->sum('amount'), 2);
        $totalAdjustments = round($adjustmentItems->sum('amount'), 2);
        $totalTax = round($revenueItems->sum('tax_amount') + $adjustmentItems->sum('tax_amount'), 2);
        $grossProfit = round($totalRevenue + $totalAdjustments, 2);
        $netProfit = round($grossProfit - $totalExpenses, 2);

        return [
            'period' => ['from' => $from, 'to' => $to],
            'revenue' => [
                'total' => $totalRevenue,
                'by_category' => $revenueByCategory,
            ],
            'expenses' => [
                'total' => $totalExpenses,
                'by_category' => $expenseByCategory,
            ],
            'adjustments' => $totalAdjustments,
            'tax_payable' => $totalTax,
            'gross_profit' => $grossProfit,
            'net_profit' => $netProfit,
            'margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0,
        ];
    }

    /**
     * Balance Sheet — simplified for e-commerce
     * Assets = total revenue collected (cash on hand)
     * Liabilities = tax payable + pending refunds
     * Equity = net profit retained
     */
    public function getBalanceSheet(?string $asOf = null): array
    {
        $date = $asOf ?? now()->toDateString();
        $entries = AccountingEntry::where('entry_date', '<=', $date)->get();

        // Assets
        $totalRevenue = round($entries->where('type', 'revenue')->sum('amount'), 2);
        $totalExpenses = round($entries->where('type', 'expense')->sum('amount'), 2);
        $totalAdjustments = round($entries->where('type', 'adjustment')->sum('amount'), 2);
        $cashOnHand = round($totalRevenue + $totalAdjustments - $totalExpenses, 2);

        // Receivables (invoices issued but not paid)
        $receivables = round(
            Invoice::where('status', 'issued')
                ->where('created_at', '<=', $date)
                ->sum('total_amount'),
            2
        );

        // Liabilities
        $taxCollected = round($entries->where('type', 'revenue')->sum('tax_amount'), 2);
        $taxRefunded = round($entries->where('type', 'adjustment')->sum('tax_amount'), 2);
        $taxPayable = round($taxCollected + $taxRefunded, 2);

        // Overdue invoices
        $overdueAmount = round(
            Invoice::where('status', 'issued')
                ->where('due_date', '<', $date)
                ->sum('total_amount'),
            2
        );

        $totalAssets = round($cashOnHand + $receivables, 2);
        $totalLiabilities = $taxPayable;
        $equity = round($totalAssets - $totalLiabilities, 2);

        return [
            'as_of' => $date,
            'assets' => [
                'cash_on_hand' => $cashOnHand,
                'accounts_receivable' => $receivables,
                'total' => $totalAssets,
            ],
            'liabilities' => [
                'tax_payable' => $taxPayable,
                'overdue_invoices' => $overdueAmount,
                'total' => $totalLiabilities,
            ],
            'equity' => $equity,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'total_adjustments' => $totalAdjustments,
                'invoice_count' => Invoice::where('created_at', '<=', $date)->count(),
                'paid_invoice_count' => Invoice::where('status', 'paid')->where('created_at', '<=', $date)->count(),
            ],
        ];
    }

    /**
     * Calculate COGS for an order based on product cost_price
     */
    public function calculateCOGS(Order $order): float
    {
        $items = $order->items;
        if (!is_array($items)) return 0;

        $cogs = 0;
        foreach ($items as $item) {
            $productId = $item['product_id'] ?? null;
            $qty = $item['quantity'] ?? $item['qty'] ?? 0;
            if (!$productId || $qty <= 0) continue;

            $product = \App\Models\Product::find($productId);
            if ($product && $product->cost_price > 0) {
                $cogs += $product->cost_price * $qty;
            }
        }

        return round($cogs, 2);
    }

    /**
     * Auto-create a confirmed export stock receipt when order is delivered
     * This deducts stock for each product in the order
     */
    public function createExportReceiptFromOrder(Order $order): ?StockReceipt
    {
        $orderItems = $order->items;
        if (!is_array($orderItems) || empty($orderItems)) return null;

        $receiptItems = [];
        foreach ($orderItems as $item) {
            $productId = $item['product_id'] ?? null;
            $qty = $item['quantity'] ?? $item['qty'] ?? 0;
            if (!$productId || $qty <= 0) continue;

            $product = \App\Models\Product::find($productId);
            if (!$product) continue;

            $receiptItems[] = [
                'product_id' => $productId,
                'product_name' => $item['product_name'] ?? $item['name'] ?? $product->name,
                'variant_id' => $item['variant_id'] ?? null,
                'sku' => $item['sku'] ?? $product->sku ?? '',
                'qty' => $qty,
                'unit_price' => $product->cost_price ?? $item['price'] ?? 0,
                'total' => $qty * ($product->cost_price ?? $item['price'] ?? 0),
            ];

            // Deduct stock immediately
            $oldStock = $product->stock;
            $product->stock = max(0, $product->stock - $qty);
            $product->save();

            // Record stock history
            \Illuminate\Support\Facades\DB::table('stock_histories')->insert([
                'product_id' => $product->id,
                'action' => 'deduct',
                'quantity_change' => -$qty,
                'stock_before' => $oldStock,
                'stock_after' => $product->stock,
                'reason' => "Xuất kho đơn hàng #{$order->id}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (empty($receiptItems)) return null;

        $totalAmount = array_sum(array_column($receiptItems, 'total'));

        // Create an already-confirmed export receipt
        $receipt = StockReceipt::create([
            'receipt_number' => StockReceipt::generateNumber('export'),
            'type' => 'export',
            'supplier_id' => null,
            'items' => $receiptItems,
            'total_amount' => $totalAmount,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'status' => 'confirmed',
            'notes' => "Tự động xuất kho từ đơn hàng #{$order->id}",
            'reference_type' => 'order',
            'reference_id' => $order->id,
            'confirmed_at' => now(),
        ]);

        return $receipt;
    }
}
