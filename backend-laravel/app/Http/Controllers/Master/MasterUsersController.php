<?php
namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Actions\MasterUser\IndexAction;
use App\Actions\MasterUser\StoreAction;
use App\Actions\MasterUser\UpdateAction;
use App\Actions\MasterUser\DestroyAction;
use Illuminate\Http\Request;

class MasterUsersController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
}
