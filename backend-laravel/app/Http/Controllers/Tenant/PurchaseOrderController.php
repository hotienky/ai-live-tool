<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\StockReceipt;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    use ApiResponse, LogsActivity;

    public function index(Request $request)
    {
        $query = PurchaseOrder::with('supplier')->orderByDesc('order_date')->orderByDesc('id');

        if ($status = $request->input('status')) $query->where('status', $status);
        if ($supplierId = $request->input('supplier_id')) $query->where('supplier_id', $supplierId);
        if ($from = $request->input('from')) $query->where('order_date', '>=', $from);
        if ($to = $request->input('to')) $query->where('order_date', '<=', $to);
        if ($payment = $request->input('payment_status')) $query->where('payment_status', $payment);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
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

    public function show($id)
    {
        return $this->successResponse(PurchaseOrder::with('supplier')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.product_name' => 'required|string',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.sku' => 'nullable|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'shipping_address' => 'nullable|string',
        ]);

        // Calc totals
        foreach ($data['items'] as &$item) {
            $item['received_qty'] = 0;
            $item['total'] = $item['qty'] * $item['unit_price'];
        }
        unset($item);

        $subtotal = array_sum(array_column($data['items'], 'total'));
        $data['subtotal'] = $subtotal;
        $data['tax_amount'] = $data['tax_amount'] ?? 0;
        $data['discount_amount'] = $data['discount_amount'] ?? 0;
        $data['total_amount'] = $subtotal + $data['tax_amount'] - $data['discount_amount'];

        $data['po_number'] = PurchaseOrder::generateNumber();
        $data['status'] = 'draft';
        $data['payment_status'] = 'unpaid';
        $data['created_by'] = $request->user()?->id;

        $po = PurchaseOrder::create($data);
        $this->logActivity('purchase_order.created', 'purchase_order', $po->id);

        return $this->successResponse($po->load('supplier'), 'Đã tạo Đơn Nhập Hàng', 201);
    }

    public function update(Request $request, $id)
    {
        $po = PurchaseOrder::findOrFail($id);
        if (!in_array($po->status, ['draft', 'ordered'])) {
            return $this->errorResponse('Chỉ có thể sửa đơn nháp hoặc đã đặt', 422);
        }

        $data = $request->validate([
            'supplier_id' => 'sometimes|integer|exists:suppliers,id',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.product_name' => 'required|string',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.sku' => 'nullable|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.received_qty' => 'nullable|integer',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'expected_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'shipping_address' => 'nullable|string',
            'payment_status' => 'nullable|in:unpaid,partial,paid',
        ]);

        if (isset($data['items'])) {
            foreach ($data['items'] as &$item) {
                $item['total'] = $item['qty'] * $item['unit_price'];
                $item['received_qty'] = $item['received_qty'] ?? 0;
            }
            unset($item);
            $subtotal = array_sum(array_column($data['items'], 'total'));
            $data['subtotal'] = $subtotal;
            $data['total_amount'] = $subtotal + ($data['tax_amount'] ?? $po->tax_amount) - ($data['discount_amount'] ?? $po->discount_amount);
        }

        $po->update($data);
        $this->logActivity('purchase_order.updated', 'purchase_order', $id);

        return $this->successResponse($po->load('supplier'), 'Đã cập nhật');
    }

    /**
     * Send order to supplier (draft → ordered)
     */
    public function send(Request $request, $id)
    {
        $po = PurchaseOrder::findOrFail($id);
        if ($po->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể gửi đơn nháp', 422);
        }

        $po->update(['status' => 'ordered']);
        $this->logActivity('purchase_order.sent', 'purchase_order', $id);

        return $this->successResponse($po, 'Đã chuyển sang trạng thái Đã đặt');
    }

    /**
     * Receive goods → auto-create stock receipt (import)
     */
    public function receive(Request $request, $id)
    {
        $po = PurchaseOrder::findOrFail($id);
        if (!in_array($po->status, ['ordered', 'partial'])) {
            return $this->errorResponse('Đơn hàng chưa được đặt hoặc đã nhận đủ', 422);
        }

        $receiveData = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.receive_qty' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $poItems = $po->items;
        $receiveItems = [];
        $allReceived = true;

        foreach ($receiveData['items'] as $ri) {
            // Find matching PO item
            foreach ($poItems as &$pi) {
                if ($pi['product_id'] == $ri['product_id']) {
                    $newReceived = ($pi['received_qty'] ?? 0) + $ri['receive_qty'];
                    // Don't exceed ordered qty
                    $actualReceive = min($ri['receive_qty'], $pi['qty'] - ($pi['received_qty'] ?? 0));
                    if ($actualReceive <= 0) continue;

                    $pi['received_qty'] = ($pi['received_qty'] ?? 0) + $actualReceive;

                    $receiveItems[] = [
                        'product_id' => $pi['product_id'],
                        'product_name' => $pi['product_name'],
                        'variant_id' => $pi['variant_id'] ?? null,
                        'sku' => $pi['sku'] ?? '',
                        'qty' => $actualReceive,
                        'unit_price' => $pi['unit_price'],
                        'total' => $actualReceive * $pi['unit_price'],
                    ];

                    if ($pi['received_qty'] < $pi['qty']) {
                        $allReceived = false;
                    }
                    break;
                }
            }
            unset($pi);
        }

        if (empty($receiveItems)) {
            return $this->errorResponse('Không có sản phẩm nào để nhận', 422);
        }

        // Check if all items fully received
        foreach ($poItems as $pi) {
            if (($pi['received_qty'] ?? 0) < $pi['qty']) {
                $allReceived = false;
                break;
            }
        }

        // Create stock receipt (import) from PO
        $receiptTotal = array_sum(array_column($receiveItems, 'total'));
        $stockReceipt = StockReceipt::create([
            'receipt_number' => StockReceipt::generateNumber('import'),
            'type' => 'import',
            'supplier_id' => $po->supplier_id,
            'items' => $receiveItems,
            'total_amount' => $receiptTotal,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'status' => 'draft',
            'notes' => "Nhận hàng từ PO {$po->po_number}" . ($receiveData['notes'] ? " - {$receiveData['notes']}" : ''),
            'reference_type' => 'purchase_order',
            'reference_id' => $po->id,
            'created_by' => $request->user()?->id,
        ]);

        // Update PO items and status
        $po->update([
            'items' => $poItems,
            'status' => $allReceived ? 'received' : 'partial',
            'received_date' => $allReceived ? now()->toDateString() : $po->received_date,
        ]);

        $this->logActivity('purchase_order.received', 'purchase_order', $id, [
            'stock_receipt_id' => $stockReceipt->id,
            'items_received' => count($receiveItems),
            'fully_received' => $allReceived,
        ]);

        return $this->successResponse([
            'purchase_order' => $po->load('supplier'),
            'stock_receipt' => $stockReceipt,
            'fully_received' => $allReceived,
        ], $allReceived
            ? "Đã nhận đủ hàng — Phiếu nhập kho {$stockReceipt->receipt_number} đã tạo (cần xác nhận)"
            : "Đã nhận một phần — Phiếu nhập kho {$stockReceipt->receipt_number} đã tạo (cần xác nhận)"
        );
    }

    /**
     * Cancel PO
     */
    public function cancel($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        if ($po->status === 'received') {
            return $this->errorResponse('Đơn đã nhận đủ, không thể hủy', 422);
        }
        if ($po->status === 'cancelled') {
            return $this->errorResponse('Đơn đã bị hủy', 422);
        }

        $po->update(['status' => 'cancelled']);
        $this->logActivity('purchase_order.cancelled', 'purchase_order', $id);

        return $this->successResponse($po, 'Đã hủy Đơn Nhập Hàng');
    }

    public function destroy($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        if ($po->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể xóa đơn nháp', 422);
        }
        $po->delete();
        $this->logActivity('purchase_order.deleted', 'purchase_order', $id);
        return $this->successResponse(null, 'Đã xóa');
    }

    public function stats(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');

        $query = PurchaseOrder::query();
        if ($from) $query->where('order_date', '>=', $from);
        if ($to) $query->where('order_date', '<=', $to);

        $all = $query->get();

        return $this->successResponse([
            'total_orders' => $all->count(),
            'total_value' => round($all->sum('total_amount'), 2),
            'pending' => $all->whereIn('status', ['draft', 'ordered', 'partial'])->count(),
            'received' => $all->where('status', 'received')->count(),
            'unpaid' => $all->where('payment_status', 'unpaid')->whereIn('status', ['ordered', 'partial', 'received'])->count(),
            'received_value' => round($all->where('status', 'received')->sum('total_amount'), 2),
        ]);
    }
}
