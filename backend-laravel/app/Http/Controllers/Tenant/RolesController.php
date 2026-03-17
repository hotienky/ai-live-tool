<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\Role\IndexAction;
use App\Actions\Role\ShowAction;
use App\Actions\Role\StoreAction;
use App\Actions\Role\UpdateAction;
use App\Actions\Role\DestroyAction;
use App\Actions\Role\PermissionsAction;
use App\Actions\Role\UsersAction;
use App\Actions\Role\AssignRoleAction;
use Illuminate\Http\Request;

class RolesController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
    public function permissions(PermissionsAction $action) { return $action(); }
    public function users(UsersAction $action) { return $action(); }
    public function assignRole(Request $request, $id, AssignRoleAction $action) { return $action($request, $id); }
}
