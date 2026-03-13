<?php

namespace App\Http\Controllers;

use App\Actions\Order\IndexAction;
use App\Actions\Order\StatsAction;
use App\Actions\Order\ShowAction;
use App\Actions\Order\UpdateStatusAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Traits\ApiResponse;

class OrdersController extends Controller
{
    use ApiResponse;

    public function index(IndexAction $action) { return $action(); }
    public function stats(StatsAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function updateStatus(Request $request, $id, UpdateStatusAction $action) { return $action($request, $id); }

    // Simple CRUD delegated to repo via DI
    public function store(Request $request)
    {
        $data = $request->all();
        $data['created_at'] = now();
        $data['updated_at'] = now();
        $id = DB::table('orders')->insertGetId($data);
        return $this->successResponse(DB::table('orders')->where('id', $id)->first(), 'Order created', 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->all();
        $data['updated_at'] = now();
        DB::table('orders')->where('id', $id)->update($data);
        return $this->successResponse(DB::table('orders')->where('id', $id)->first(), 'Order updated');
    }

    public function destroy($id)
    {
        DB::table('orders')->where('id', $id)->delete();
        return $this->successResponse(null, 'Order deleted');
    }

    public function getDetails($id) { return $this->successResponse(DB::table('order_details')->where('order_id', $id)->get()); }
    public function getTotals($id) { return $this->successResponse(DB::table('order_totals')->where('order_id', $id)->orderBy('sort')->get()); }
    public function getHistory($id) { return $this->successResponse(DB::table('order_histories')->where('order_id', $id)->orderByDesc('add_date')->get()); }
    public function getOrderStatuses() { return $this->successResponse(DB::table('order_statuses')->get()); }
    public function getPaymentStatuses() { return $this->successResponse(DB::table('payment_statuses')->get()); }
}
