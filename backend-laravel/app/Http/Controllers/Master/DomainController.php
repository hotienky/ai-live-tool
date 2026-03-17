<?php

namespace App\Http\Controllers\Master;

use App\Actions\Domain\DestroyAction;
use App\Actions\Domain\IndexAction;
use App\Actions\Domain\StoreAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    public function index($tenantId, IndexAction $action)
    {
        return $action($tenantId);
    }

    public function store(Request $request, $tenantId, StoreAction $action)
    {
        return $action($request, $tenantId);
    }

    public function destroy($tenantId, $domainId, DestroyAction $action)
    {
        return $action($tenantId, $domainId);
    }
}
