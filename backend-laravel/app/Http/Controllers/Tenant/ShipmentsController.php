<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShipmentsController extends Controller
{
    use ApiResponse;

    /**
     * GET /shipments — danh sách vận đơn (filter: status, carrier)
     */
    public function index(Request $request)
    {
        $query = DB::table('shipments')->orderByDesc('id');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($carrier = $request->query('carrier')) {
            $query->where('carrier', $carrier);
        }

        return response()->json($query->get());
    }

    /**
     * GET /shipments/stats — thống kê vận đơn
     */
    public function stats()
    {
        $all = DB::table('shipments')->get();
        $statusCounts = $all->groupBy('status')->map->count();

        return response()->json([
            'total'        => $all->count(),
            'totalFees'    => $all->sum('shipping_fee'),
            'statusCounts' => $statusCounts,
        ]);
    }

    /**
     * POST /shipments — tạo vận đơn mới
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'orderId'          => 'nullable|integer',
            'carrier'          => 'required|string|in:manual,ghn,ghtk,viettel_post',
            'receiverName'     => 'required|string|max:255',
            'receiverPhone'    => 'required|string|max:20',
            'receiverAddress'  => 'required|string',
            'receiverWard'     => 'nullable|string|max:100',
            'receiverDistrict' => 'nullable|string|max:100',
            'receiverProvince' => 'nullable|string|max:100',
            'shippingFee'      => 'nullable|numeric|min:0',
            'codAmount'        => 'nullable|numeric|min:0',
            'weight'           => 'nullable|integer|min:0',
            'insuranceFee'     => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $now = now();

        $id = DB::table('shipments')->insertGetId([
            'order_id'          => $data['orderId'] ?? null,
            'carrier'           => $data['carrier'],
            'receiver_name'     => $data['receiverName'],
            'receiver_phone'    => $data['receiverPhone'],
            'receiver_address'  => $data['receiverAddress'],
            'receiver_ward'     => $data['receiverWard'] ?? null,
            'receiver_district' => $data['receiverDistrict'] ?? null,
            'receiver_province' => $data['receiverProvince'] ?? null,
            'shipping_fee'      => $data['shippingFee'] ?? 0,
            'cod_amount'        => $data['codAmount'] ?? 0,
            'weight'            => $data['weight'] ?? 500,
            'insurance_fee'     => $data['insuranceFee'] ?? 0,
            'notes'             => $data['notes'] ?? null,
            'status'            => 'pending',
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);

        // Auto-generate tracking code
        $trackingCode = 'VD-' . str_pad($id, 6, '0', STR_PAD_LEFT);
        DB::table('shipments')->where('id', $id)->update(['tracking_code' => $trackingCode]);

        // Insert initial history entry
        DB::table('shipment_history')->insert([
            'shipment_id' => $id,
            'status'      => 'pending',
            'description' => 'Vận đơn được tạo',
            'source'      => 'admin',
            'created_at'  => $now,
        ]);

        // Auto-update order status to 'confirmed' if still pending
        if (!empty($data['orderId'])) {
            DB::table('orders')
                ->where('id', $data['orderId'])
                ->where('status', 'pending')
                ->update(['status' => 'confirmed', 'updated_at' => $now]);
        }

        $shipment = DB::table('shipments')->where('id', $id)->first();

        return $this->successResponse($shipment, 'Shipment created', 201);
    }

    /**
     * GET /shipments/{id} — chi tiết vận đơn
     */
    public function show(int $id)
    {
        $shipment = DB::table('shipments')->where('id', $id)->first();
        if (!$shipment) {
            return $this->errorResponse('Shipment not found', 404);
        }
        return $this->successResponse($shipment);
    }

    /**
     * PUT /shipments/{id}/status — cập nhật trạng thái + ghi history
     */
    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'status'      => 'required|string|in:draft,pending,picked_up,in_transit,out_for_delivery,delivered,returned,cancelled',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
        ]);

        $shipment = DB::table('shipments')->where('id', $id)->first();
        if (!$shipment) {
            return $this->errorResponse('Shipment not found', 404);
        }

        $now = now();
        $update = [
            'status'     => $data['status'],
            'updated_at' => $now,
        ];

        // Set delivered_at timestamp
        if ($data['status'] === 'delivered') {
            $update['delivered_at'] = $now;
        }

        DB::table('shipments')->where('id', $id)->update($update);

        // Insert history entry
        DB::table('shipment_history')->insert([
            'shipment_id' => $id,
            'status'      => $data['status'],
            'description' => $data['description'] ?? null,
            'location'    => $data['location'] ?? null,
            'source'      => 'admin',
            'created_at'  => $now,
        ]);

        // Auto-sync order status
        if ($shipment->order_id) {
            if ($data['status'] === 'delivered') {
                DB::table('orders')
                    ->where('id', $shipment->order_id)
                    ->update(['status' => 'delivered', 'delivered_at' => $now, 'updated_at' => $now]);
            } elseif (in_array($data['status'], ['picked_up', 'in_transit', 'out_for_delivery'])) {
                DB::table('orders')
                    ->where('id', $shipment->order_id)
                    ->whereNotIn('status', ['delivered', 'cancelled'])
                    ->update(['status' => 'shipping', 'updated_at' => $now]);
            }
        }

        $updated = DB::table('shipments')->where('id', $id)->first();
        return $this->successResponse($updated, 'Status updated');
    }

    /**
     * DELETE /shipments/{id} — xóa vận đơn (chỉ khi draft)
     */
    public function destroy(int $id)
    {
        $shipment = DB::table('shipments')->where('id', $id)->first();
        if (!$shipment) {
            return $this->errorResponse('Shipment not found', 404);
        }
        if ($shipment->status !== 'draft') {
            return $this->errorResponse('Chỉ có thể xóa vận đơn ở trạng thái nháp', 400);
        }

        DB::table('shipment_history')->where('shipment_id', $id)->delete();
        DB::table('shipments')->where('id', $id)->delete();

        return $this->successResponse(null, 'Shipment deleted');
    }

    /**
     * GET /shipments/{id}/tracking — lấy tracking history
     */
    public function tracking(int $id)
    {
        $history = DB::table('shipment_history')
            ->where('shipment_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($history);
    }
}
