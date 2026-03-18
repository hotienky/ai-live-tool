<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\PaymentVoucher;
use App\Models\AccountingEntry;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class PaymentVoucherController extends Controller
{
    use ApiResponse, LogsActivity;

    public function index(Request $request)
    {
        $query = PaymentVoucher::query()->orderByDesc('voucher_date')->orderByDesc('id');

        if ($type = $request->input('type')) $query->where('type', $type);
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($from = $request->input('from')) $query->where('voucher_date', '>=', $from);
        if ($to = $request->input('to')) $query->where('voucher_date', '<=', $to);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('voucher_number', 'like', "%{$search}%")
                  ->orWhere('counterparty', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
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

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:receipt,payment',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'payment_method' => 'nullable|string|in:cash,bank,wallet,other',
            'counterparty' => 'nullable|string|max:255',
            'voucher_date' => 'required|date',
            'reference_type' => 'nullable|string',
            'reference_id' => 'nullable|integer',
        ]);

        $data['voucher_number'] = PaymentVoucher::generateNumber($data['type']);
        $data['status'] = 'draft';
        $data['payment_method'] = $data['payment_method'] ?? 'cash';
        $data['created_by'] = $request->user()?->id;

        $voucher = PaymentVoucher::create($data);
        $this->logActivity('payment_voucher.created', 'payment_voucher', $voucher->id);

        return $this->successResponse($voucher, 'Đã tạo phiếu', 201);
    }

    public function show($id)
    {
        return $this->successResponse(PaymentVoucher::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $voucher = PaymentVoucher::findOrFail($id);
        if ($voucher->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể sửa phiếu nháp', 422);
        }

        $data = $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'category' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'payment_method' => 'nullable|string|in:cash,bank,wallet,other',
            'counterparty' => 'nullable|string|max:255',
            'voucher_date' => 'sometimes|date',
        ]);

        $voucher->update($data);
        $this->logActivity('payment_voucher.updated', 'payment_voucher', $id);

        return $this->successResponse($voucher, 'Đã cập nhật');
    }

    /**
     * Confirm voucher → create accounting entry
     */
    public function confirm(Request $request, $id)
    {
        $voucher = PaymentVoucher::findOrFail($id);
        if ($voucher->status !== 'draft') {
            return $this->errorResponse('Phiếu này đã được xác nhận hoặc hủy', 422);
        }

        // Create accounting entry
        $accountingType = $voucher->type === 'receipt' ? 'revenue' : 'expense';
        AccountingEntry::create([
            'type' => $accountingType,
            'category' => $voucher->category,
            'amount' => $voucher->amount,
            'description' => ($voucher->type === 'receipt' ? 'Phiếu thu' : 'Phiếu chi')
                . " {$voucher->voucher_number}"
                . ($voucher->counterparty ? " - {$voucher->counterparty}" : '')
                . ($voucher->description ? ": {$voucher->description}" : ''),
            'reference_type' => 'payment_voucher',
            'reference_id' => $voucher->id,
            'entry_date' => $voucher->voucher_date,
            'created_by' => $request->user()?->id,
        ]);

        $voucher->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'confirmed_by' => $request->user()?->id,
        ]);

        $this->logActivity('payment_voucher.confirmed', 'payment_voucher', $id);
        return $this->successResponse($voucher, 'Đã xác nhận phiếu — Bút toán đã tạo');
    }

    public function cancel($id)
    {
        $voucher = PaymentVoucher::findOrFail($id);
        if ($voucher->status === 'cancelled') {
            return $this->errorResponse('Phiếu đã bị hủy', 422);
        }

        if ($voucher->status === 'confirmed') {
            AccountingEntry::where('reference_type', 'payment_voucher')
                ->where('reference_id', $voucher->id)
                ->delete();
        }

        $voucher->update(['status' => 'cancelled']);
        $this->logActivity('payment_voucher.cancelled', 'payment_voucher', $id);

        return $this->successResponse($voucher, 'Đã hủy phiếu');
    }

    public function destroy($id)
    {
        $voucher = PaymentVoucher::findOrFail($id);
        if ($voucher->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể xóa phiếu nháp', 422);
        }
        $voucher->delete();
        $this->logActivity('payment_voucher.deleted', 'payment_voucher', $id);
        return $this->successResponse(null, 'Đã xóa');
    }

    /**
     * Stats for dashboard
     */
    public function stats(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');

        $query = PaymentVoucher::confirmed();
        if ($from) $query->where('voucher_date', '>=', $from);
        if ($to) $query->where('voucher_date', '<=', $to);

        $vouchers = $query->get();

        return $this->successResponse([
            'total_receipts' => round($vouchers->where('type', 'receipt')->sum('amount'), 2),
            'total_payments' => round($vouchers->where('type', 'payment')->sum('amount'), 2),
            'receipt_count' => $vouchers->where('type', 'receipt')->count(),
            'payment_count' => $vouchers->where('type', 'payment')->count(),
            'pending_drafts' => PaymentVoucher::where('status', 'draft')->count(),
        ]);
    }
}
