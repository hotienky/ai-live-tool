<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\Category\IndexAction;
use App\Actions\Category\ShowAction;
use App\Actions\Category\StoreAction;
use App\Actions\Category\UpdateAction;
use App\Actions\Category\DestroyAction;
use Illuminate\Http\Request;

class CategoriesController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
}
