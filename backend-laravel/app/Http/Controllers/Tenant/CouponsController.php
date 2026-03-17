<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\Coupon\IndexAction;
use App\Actions\Coupon\StoreAction;
use App\Actions\Coupon\UpdateAction;
use App\Actions\Coupon\DestroyAction;
use App\Actions\Coupon\ValidateAction;
use Illuminate\Http\Request;

class CouponsController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
    public function validate(Request $request, ValidateAction $action) { return $action($request); }
}
