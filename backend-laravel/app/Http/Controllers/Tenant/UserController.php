<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Actions\User\IndexAction;
use App\Actions\User\ShowAction;
use App\Actions\User\StoreAction;
use App\Actions\User\UpdateAction;
use App\Actions\User\DestroyAction;
use App\Actions\User\ToggleActiveAction;
use Illuminate\Http\Request;

/**
 * Manages tenant CMS staff users (create / list / update / delete / assign role).
 * All endpoints require permission:system.users.
 */
class UserController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function toggleActive($id, ToggleActiveAction $action) { return $action($id); }
    public function destroy(Request $request, $id, DestroyAction $action) { return $action($request, $id); }
}
