<?php
namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Actions\MasterRole\IndexAction;
use App\Actions\MasterRole\StoreAction;
use App\Actions\MasterRole\UpdateAction;
use App\Actions\MasterRole\DestroyAction;
use Illuminate\Http\Request;

class MasterRolesController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
}
