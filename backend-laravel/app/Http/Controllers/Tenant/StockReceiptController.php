<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\StockReceipt;
use App\Models\AccountingEntry;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StockReceiptController extends Controller
{
    use ApiResponse, LogsActivity;

    /**
     * List stock receipts with filters
     */
    public function index(Request $request)
    {
        $query = StockReceipt::query()->orderByDesc('created_at');

        if ($type = $request->input('type')) $query->where('type', $type);
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($supplierId = $request->input('supplier_id')) $query->where('supplier_id', $supplierId);
        if ($from = $request->input('from')) $query->where('created_at', '>=', $from);
        if ($to = $request->input('to')) $query->where('created_at', '<=', $to . ' 23:59:59');
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
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
     * Show single receipt
     */
    public function show($id)
    {
        $receipt = StockReceipt::with('supplier')->findOrFail($id);
        return $this->successResponse($receipt);
    }

    /**
     * Create draft receipt
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:import,export,return,adjust',
            'supplier_id' => 'nullable|integer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.product_name' => 'required|string',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.sku' => 'nullable|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'reference_type' => 'nullable|string',
            'reference_id' => 'nullable|integer',
        ]);

        // Calculate item totals
        foreach ($data['items'] as &$item) {
            $item['total'] = $item['qty'] * $item['unit_price'];
        }
        unset($item);

        // Calculate total if not provided
        $itemsTotal = array_sum(array_column($data['items'], 'total'));
        $data['total_amount'] = $data['total_amount'] ?? $itemsTotal;
        $data['tax_amount'] = $data['tax_amount'] ?? 0;
        $data['discount_amount'] = $data['discount_amount'] ?? 0;

        $data['receipt_number'] = StockReceipt::generateNumber($data['type']);
        $data['status'] = 'draft';
        $data['created_by'] = $request->user()?->id;

        $receipt = StockReceipt::create($data);
        $this->logActivity('stock_receipt.created', 'stock_receipt', $receipt->id, [
            'type' => $data['type'],
            'receipt_number' => $data['receipt_number'],
        ]);

        return $this->successResponse($receipt, 'Đã tạo phiếu kho', 201);
    }

    /**
     * Update draft receipt
     */
    public function update(Request $request, $id)
    {
        $receipt = StockReceipt::findOrFail($id);
        if ($receipt->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể sửa phiếu nháp', 422);
        }

        $data = $request->validate([
            'supplier_id' => 'nullable|integer',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.product_name' => 'required|string',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.sku' => 'nullable|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        if (isset($data['items'])) {
            foreach ($data['items'] as &$item) {
                $item['total'] = $item['qty'] * $item['unit_price'];
            }
            unset($item);
            $data['total_amount'] = $data['total_amount'] ?? array_sum(array_column($data['items'], 'total'));
        }

        $receipt->update($data);
        $this->logActivity('stock_receipt.updated', 'stock_receipt', $id);

        return $this->successResponse($receipt, 'Đã cập nhật phiếu kho');
    }

    /**
     * Confirm receipt → update stock + create accounting entry
     */
    public function confirm(Request $request, $id)
    {
        $receipt = StockReceipt::findOrFail($id);
        if ($receipt->status !== 'draft') {
            return $this->errorResponse('Phiếu này đã được xác nhận hoặc hủy', 422);
        }

        $items = $receipt->items;
        if (empty($items)) {
            return $this->errorResponse('Phiếu không có sản phẩm', 422);
        }

        // Update stock for each item
        foreach ($items as $item) {
            $product = \App\Models\Product::find($item['product_id']);
            if (!$product) continue;

            $qtyChange = 0;
            $action = '';

            if (in_array($receipt->type, ['import'])) {
                // Nhập kho: tăng stock
                $qtyChange = $item['qty'];
                $action = 'add';
            } elseif (in_array($receipt->type, ['export'])) {
                // Xuất kho: giảm stock
                $qtyChange = -$item['qty'];
                $action = 'deduct';
            } elseif ($receipt->type === 'return') {
                // Trả hàng NCC: giảm stock
                $qtyChange = -$item['qty'];
                $action = 'deduct';
            } elseif ($receipt->type === 'adjust') {
                // Kiểm kê: set to qty (delta = qty - current)
                $qtyChange = $item['qty'] - $product->stock;
                $action = 'adjust';
            }

            $oldStock = $product->stock;
            $product->stock = max(0, $product->stock + $qtyChange);
            $product->save();

            // Record stock history
            DB::table('stock_histories')->insert([
                'product_id' => $product->id,
                'action' => $action,
                'quantity_change' => $qtyChange,
                'stock_before' => $oldStock,
                'stock_after' => $product->stock,
                'reason' => "Phiếu {$receipt->receipt_number}: " . ($receipt->notes ?: $this->receiptTypeLabel($receipt->type)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update cost price (weighted average) for imports
            if ($receipt->type === 'import' && ($item['unit_price'] ?? 0) > 0) {
                $totalValue = ($product->cost_price ?? 0) * $oldStock + $item['unit_price'] * $item['qty'];
                $totalQty = $oldStock + $item['qty'];
                if ($totalQty > 0) {
                    $product->cost_price = round($totalValue / $totalQty, 2);
                    $product->save();
                }
            }
        }

        // Create accounting entry
        if ($receipt->total_amount > 0) {
            $accountingType = in_array($receipt->type, ['import']) ? 'expense' : 'adjustment';
            $category = match ($receipt->type) {
                'import' => 'inventory_purchase',
                'export' => 'inventory_export',
                'return' => 'inventory_return',
                'adjust' => 'inventory_adjust',
            };

            AccountingEntry::create([
                'type' => $accountingType,
                'category' => $category,
                'amount' => $accountingType === 'expense' ? $receipt->total_amount : -$receipt->total_amount,
                'tax_amount' => $receipt->tax_amount ?? 0,
                'description' => "Phiếu {$receipt->receipt_number} - {$this->receiptTypeLabel($receipt->type)}",
                'reference_type' => 'stock_receipt',
                'reference_id' => $receipt->id,
                'entry_date' => now()->toDateString(),
                'created_by' => $request->user()?->id,
            ]);
        }

        $receipt->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'confirmed_by' => $request->user()?->id,
        ]);

        $this->logActivity('stock_receipt.confirmed', 'stock_receipt', $id, [
            'type' => $receipt->type,
            'items_count' => count($items),
        ]);

        return $this->successResponse($receipt, 'Đã xác nhận phiếu kho — Kho và kế toán đã cập nhật');
    }

    /**
     * Cancel a receipt (only draft or confirmed without reversing stock for now)
     */
    public function cancel(Request $request, $id)
    {
        $receipt = StockReceipt::findOrFail($id);
        if ($receipt->status === 'cancelled') {
            return $this->errorResponse('Phiếu đã bị hủy', 422);
        }

        // If confirmed, reverse stock changes
        if ($receipt->status === 'confirmed') {
            $items = $receipt->items;
            foreach ($items as $item) {
                $product = \App\Models\Product::find($item['product_id']);
                if (!$product) continue;

                $oldStock = $product->stock;
                if (in_array($receipt->type, ['import'])) {
                    $product->stock = max(0, $product->stock - $item['qty']);
                } elseif (in_array($receipt->type, ['export', 'return'])) {
                    $product->stock += $item['qty'];
                }
                $product->save();

                DB::table('stock_histories')->insert([
                    'product_id' => $product->id,
                    'action' => 'adjust',
                    'quantity_change' => $product->stock - $oldStock,
                    'stock_before' => $oldStock,
                    'stock_after' => $product->stock,
                    'reason' => "HỦY Phiếu {$receipt->receipt_number}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Cancel accounting entry
            AccountingEntry::where('reference_type', 'stock_receipt')
                ->where('reference_id', $receipt->id)
                ->delete();
        }

        $receipt->update(['status' => 'cancelled']);
        $this->logActivity('stock_receipt.cancelled', 'stock_receipt', $id);

        return $this->successResponse($receipt, 'Đã hủy phiếu kho');
    }

    /**
     * Delete draft receipt
     */
    public function destroy($id)
    {
        $receipt = StockReceipt::findOrFail($id);
        if ($receipt->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể xóa phiếu nháp', 422);
        }
        $receipt->delete();
        $this->logActivity('stock_receipt.deleted', 'stock_receipt', $id);
        return $this->successResponse(null, 'Đã xóa phiếu kho');
    }

    /**
     * Stats summary
     */
    public function stats(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');

        $query = StockReceipt::confirmed();
        if ($from) $query->where('confirmed_at', '>=', $from);
        if ($to) $query->where('confirmed_at', '<=', $to . ' 23:59:59');

        $receipts = $query->get();

        return $this->successResponse([
            'total_imports' => $receipts->where('type', 'import')->count(),
            'total_exports' => $receipts->where('type', 'export')->count(),
            'import_value' => round($receipts->where('type', 'import')->sum('total_amount'), 2),
            'export_value' => round($receipts->where('type', 'export')->sum('total_amount'), 2),
            'pending_drafts' => StockReceipt::draft()->count(),
        ]);
    }

    private function receiptTypeLabel(string $type): string
    {
        return match ($type) {
            'import' => 'Nhập kho',
            'export' => 'Xuất kho',
            'return' => 'Trả hàng NCC',
            'adjust' => 'Kiểm kê',
            default => $type,
        };
    }
}
