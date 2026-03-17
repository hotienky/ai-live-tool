<?php
namespace App\Actions\Storefront;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShipmentTrackingAction extends BaseAction
{
    public function __invoke(Request $request, int $orderId)
    {
        $phone = $request->query('phone');
        if (!$phone) {
            return $this->errorResponse('Phone number is required', 400);
        }

        $order = $this->orderRepo->find($orderId);
        if (!$order || $order->customer_phone !== $phone) {
            return $this->notFoundResponse('Order not found');
        }

        $shipment = DB::table('shipments')->where('order_id', $orderId)->first();

        if (!$shipment) {
            return $this->successResponse([
                'order_id' => $orderId,
                'status' => 'pending',
                'message' => 'Đơn hàng chưa được giao cho đơn vị vận chuyển',
                'shipment' => null,
                'history' => [],
            ]);
        }

        $history = DB::table('shipment_history')
            ->where('shipment_id', $shipment->id)
            ->orderByDesc('created_at')
            ->get();

        return $this->successResponse([
            'order_id' => $orderId,
            'status' => $shipment->status,
            'carrier' => $shipment->carrier,
            'tracking_code' => $shipment->tracking_code,
            'carrier_order_code' => $shipment->carrier_order_code,
            'receiver_name' => $shipment->receiver_name,
            'receiver_phone' => $shipment->receiver_phone,
            'receiver_address' => $shipment->receiver_address,
            'shipping_fee' => $shipment->shipping_fee,
            'delivered_at' => $shipment->delivered_at,
            'shipment' => $shipment,
            'history' => $history,
        ]);
    }
}
