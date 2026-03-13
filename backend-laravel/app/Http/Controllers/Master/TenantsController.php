<?php

namespace App\Http\Controllers\Master;
use App\Http\Controllers\Controller;

use App\Repositories\Tenant\TenantRepositoryInterface;
use App\Transformers\TenantTransformer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TenantsController extends Controller
{
    use ApiResponse;

    public function __construct(
        private TenantRepositoryInterface $repo,
        private TenantTransformer $transformer,
    ) {}

    public function index()
    {
        return $this->successResponse($this->transformer->transformCollection($this->repo->all()));
    }

    public function show($id)
    {
        return $this->successResponse($this->transformer->transform($this->repo->findOne($id)));
    }

    public function store(Request $request)
    {
        $tenant = $this->repo->store($request->all());
        return $this->successResponse($this->transformer->transform($tenant), 'Tenant created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->transformer->transform($this->repo->findOne($id)));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Tenant deleted');
    }

    public function suspend($id)
    {
        $tenant = $this->repo->suspend($id);
        return $this->successResponse($this->transformer->transform($tenant), 'Tenant suspended');
    }

    public function activate($id)
    {
        $tenant = $this->repo->activate($id);
        return $this->successResponse($this->transformer->transform($tenant), 'Tenant activated');
    }

    public function migrate($id)
    {
        return $this->successResponse(null, 'Migration triggered');
    }

    public function seed($id)
    {
        return $this->successResponse(null, 'Seeding triggered');
    }
}
