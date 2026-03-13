<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Actions\Product\IndexAction;
use App\Actions\Product\StoreAction;
use App\Actions\Product\UpdateAction;
use App\Actions\Product\DestroyAction;
use App\Actions\Product\AdjustStockAction;
use Illuminate\Http\Request;

class ProductsController extends Controller
{
    public function index(IndexAction $action)
    {
        return $action();
    }

    public function store(Request $request, StoreAction $action)
    {
        return $action($request);
    }

    public function update(Request $request, $id, UpdateAction $action)
    {
        return $action($request, $id);
    }

    public function destroy($id, DestroyAction $action)
    {
        return $action($id);
    }

    public function adjustStock(Request $request, $id, AdjustStockAction $action)
    {
        return $action($request, $id);
    }
}
