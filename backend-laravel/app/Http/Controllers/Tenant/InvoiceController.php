<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\AccountingService;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(
        private AccountingService $accountingService,
    ) {}

    /**
     * List invoices
     */
    public function index(Request $request)
    {
        $query = Invoice::query()->orderByDesc('created_at');

        if ($status = $request->input('status')) $query->where('status', $status);
        if ($from = $request->input('from')) $query->where('created_at', '>=', $from);
        if ($to = $request->input('to')) $query->where('created_at', '<=', $to);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        $perPage = min($request->input('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        return $this->successResponse([
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Show single invoice
     */
    public function show($id)
    {
        $invoice = Invoice::findOrFail($id);
        return $this->successResponse($invoice);
    }

    /**
     * Preview invoice with full seller info (for frontend modal)
     */
    public function preview($id)
    {
        $invoice = Invoice::findOrFail($id);
        $storeInfo = $this->getSellerInfo();

        return $this->successResponse([
            'invoice' => $invoice,
            'seller' => $storeInfo,
        ]);
    }

    /**
     * Send invoice email to customer
     */
    public function sendEmail($id)
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->customer_email) {
            return $this->errorResponse('Khách hàng chưa có email', 422);
        }

        try {
            $config = $this->accountingService->getAccountingConfig();
            $mail = new \App\Mail\InvoiceMail($invoice);
            $mail->footerText = $config['footer_text'] ?? 'Cảm ơn quý khách!';
            \Illuminate\Support\Facades\Mail::to($invoice->customer_email)->send($mail);

            $this->logActivity('invoice.email_sent', 'invoice', $id, ['to' => $invoice->customer_email]);
            return $this->successResponse(null, 'Đã gửi email hoá đơn');
        } catch (\Exception $e) {
            return $this->errorResponse('Gửi email thất bại: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create invoice manually
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'nullable|string',
            'customer_address' => 'nullable|string',
            'customer_email' => 'nullable|email',
            'items' => 'required|array',
            'subtotal' => 'required|numeric',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'shipping_fee' => 'nullable|numeric',
            'total_amount' => 'required|numeric',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $data['invoice_number'] = Invoice::generateNumber();
        $data['status'] = 'draft';
        $invoice = Invoice::create($data);
        $this->logActivity('invoice.created', 'invoice', $invoice->id);
        return $this->successResponse($invoice, 'Đã tạo hóa đơn', 201);
    }

    /**
     * Create invoice from existing order
     */
    public function createFromOrder(Request $request, $orderId)
    {
        $order = \App\Models\Order::findOrFail($orderId);
        // Check if invoice already exists
        $existing = Invoice::where('order_id', $orderId)->first();
        if ($existing) {
            return $this->successResponse($existing, 'Hóa đơn đã tồn tại');
        }
        $invoice = $this->accountingService->createInvoiceFromOrder($order);
        $this->logActivity('invoice.created', 'invoice', $invoice->id, ['order_id' => $orderId]);
        return $this->successResponse($invoice, 'Đã tạo hóa đơn từ đơn hàng', 201);
    }

    /**
     * Update invoice status
     */
    public function updateStatus(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|in:draft,issued,paid,cancelled',
        ]);
        $invoice = Invoice::findOrFail($id);
        $invoice->update([
            'status' => $data['status'],
            'issued_at' => $data['status'] === 'issued' ? now() : $invoice->issued_at,
        ]);
        $this->logActivity('invoice.status_updated', 'invoice', $id, ['status' => $data['status']]);
        return $this->successResponse($invoice, 'Đã cập nhật trạng thái');
    }

    /**
     * Delete invoice
     */
    public function destroy($id)
    {
        Invoice::findOrFail($id)->delete();
        $this->logActivity('invoice.deleted', 'invoice', $id);
        return $this->successResponse(null, 'Đã xoá hóa đơn');
    }

    /**
     * Export invoice as PDF (or HTML for browser print)
     */
    public function exportPdf($id)
    {
        $invoice = Invoice::findOrFail($id);

        // Get store/seller info from accounting config
        $storeInfo = [];
        try {
            $accConfigs = \App\Models\SystemConfig::where('group', 'accounting')
                ->whereIn('key', ['seller_name', 'seller_phone', 'seller_email', 'seller_address', 'seller_tax_id'])
                ->get();
            foreach ($accConfigs as $c) {
                $key = str_replace('seller_', '', $c->key);
                if ($key === 'tax_id') $key = 'tax_id';
                $storeInfo[$key] = $c->value;
            }
            // Remap for template compatibility
            if (!empty($storeInfo)) {
                $storeInfo['name'] = $storeInfo['name'] ?? '';
                $storeInfo['phone'] = $storeInfo['phone'] ?? '';
                $storeInfo['email'] = $storeInfo['email'] ?? '';
                $storeInfo['address'] = $storeInfo['address'] ?? '';
            }
        } catch (\Exception $e) { /* silent */ }

        $html = view('pdf.invoice', compact('invoice', 'storeInfo'))->render();

        // If DomPDF is available, return actual PDF
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', compact('invoice', 'storeInfo'));
            return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
        }

        // Fallback: return HTML (user can print from browser)
        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * Get seller info from accounting config
     */
    private function getSellerInfo(): array
    {
        $storeInfo = [];
        try {
            $configs = \App\Models\SystemConfig::where('group', 'accounting')
                ->whereIn('key', ['seller_name', 'seller_phone', 'seller_email', 'seller_address', 'seller_tax_id'])
                ->get();
            foreach ($configs as $c) {
                $key = str_replace('seller_', '', $c->key);
                $storeInfo[$key] = $c->value;
            }
            if (!empty($storeInfo)) {
                $storeInfo['name'] = $storeInfo['name'] ?? '';
                $storeInfo['phone'] = $storeInfo['phone'] ?? '';
                $storeInfo['email'] = $storeInfo['email'] ?? '';
                $storeInfo['address'] = $storeInfo['address'] ?? '';
            }
        } catch (\Exception $e) { /* silent */ }
        return $storeInfo;
    }
}
