<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    use ApiResponse, LogsActivity;

    public function index(Request $request)
    {
        $query = Supplier::query()->orderBy('name');
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($request->input('active_only') === 'true') {
            $query->where('is_active', true);
        }
        return $this->successResponse($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $supplier = Supplier::create($data);
        $this->logActivity('supplier.created', 'supplier', $supplier->id);
        return $this->successResponse($supplier, 'Đã tạo nhà cung cấp', 201);
    }

    public function show($id)
    {
        return $this->successResponse(Supplier::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $supplier->update($data);
        $this->logActivity('supplier.updated', 'supplier', $id);
        return $this->successResponse($supplier, 'Đã cập nhật');
    }

    public function destroy($id)
    {
        Supplier::findOrFail($id)->delete();
        $this->logActivity('supplier.deleted', 'supplier', $id);
        return $this->successResponse(null, 'Đã xóa');
    }

    /**
     * Supplier debt report — total PO value vs payments made
     */
    public function debtReport()
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        $report = [];
        foreach ($suppliers as $supplier) {
            // Total value of received POs from this supplier
            $totalPOValue = \App\Models\PurchaseOrder::where('supplier_id', $supplier->id)
                ->whereIn('status', ['received', 'partial'])
                ->sum('total_amount');

            // Total payments made (confirmed stock receipt entries for this supplier)
            $totalPaid = \App\Models\StockReceipt::where('supplier_id', $supplier->id)
                ->where('status', 'confirmed')
                ->where('type', 'import')
                ->sum('total_amount');

            // Also include payment vouchers to this supplier
            $voucherPaid = \App\Models\PaymentVoucher::where('status', 'confirmed')
                ->where('type', 'payment')
                ->where('counterparty', 'like', "%{$supplier->name}%")
                ->sum('amount');

            $debt = $totalPOValue - $totalPaid - $voucherPaid;

            if ($totalPOValue > 0 || $debt != 0) {
                $report[] = [
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->name,
                    'total_po_value' => round($totalPOValue, 2),
                    'total_paid' => round($totalPaid + $voucherPaid, 2),
                    'debt' => round(max(0, $debt), 2),
                    'overpaid' => round(max(0, -$debt), 2),
                ];
            }
        }

        $totalDebt = array_sum(array_column($report, 'debt'));
        $totalPaid = array_sum(array_column($report, 'total_paid'));

        return $this->successResponse([
            'suppliers' => $report,
            'summary' => [
                'total_debt' => round($totalDebt, 2),
                'total_paid' => round($totalPaid, 2),
                'suppliers_with_debt' => count(array_filter($report, fn($r) => $r['debt'] > 0)),
            ],
        ]);
    }
}
