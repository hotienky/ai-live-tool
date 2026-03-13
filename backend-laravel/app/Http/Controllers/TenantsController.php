<?php

namespace App\Http\Controllers;

use App\Repositories\Tenant\TenantRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TenantsController extends Controller
{
    use ApiResponse;

    public function __construct(private TenantRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        return $this->successResponse($this->repo->findOne($id));
    }

    public function store(Request $request)
    {
        $tenant = $this->repo->store($request->all());
        return $this->successResponse($tenant, 'Tenant created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Tenant deleted');
    }

    public function suspend($id)
    {
        $tenant = $this->repo->suspend($id);
        return $this->successResponse($tenant, 'Tenant suspended');
    }

    public function activate($id)
    {
        $tenant = $this->repo->activate($id);
        return $this->successResponse($tenant, 'Tenant activated');
    }

    public function migrate($id)
    {
        // Placeholder — trigger migration for tenant
        return $this->successResponse(null, 'Migration triggered');
    }

    public function seed($id)
    {
        // Placeholder — trigger seeding for tenant
        return $this->successResponse(null, 'Seeding triggered');
    }
}
