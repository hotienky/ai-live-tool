<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\FlashSale\IndexAction;
use App\Actions\FlashSale\ShowAction;
use App\Actions\FlashSale\StoreAction;
use App\Actions\FlashSale\UpdateAction;
use App\Actions\FlashSale\DestroyAction;
use App\Actions\FlashSale\ActiveAction;
use Illuminate\Http\Request;

class FlashSalesController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
    public function active(ActiveAction $action) { return $action(); }
}
