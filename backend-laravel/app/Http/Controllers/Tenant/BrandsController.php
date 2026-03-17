<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\Brand\IndexAction;
use App\Actions\Brand\ShowAction;
use App\Actions\Brand\StoreAction;
use App\Actions\Brand\UpdateAction;
use App\Actions\Brand\DestroyAction;
use Illuminate\Http\Request;

class BrandsController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
}
