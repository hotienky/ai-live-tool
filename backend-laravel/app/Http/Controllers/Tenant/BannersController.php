<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\Banner\IndexAction;
use App\Actions\Banner\ShowAction;
use App\Actions\Banner\StoreAction;
use App\Actions\Banner\UpdateAction;
use App\Actions\Banner\DestroyAction;
use Illuminate\Http\Request;

class BannersController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
}
