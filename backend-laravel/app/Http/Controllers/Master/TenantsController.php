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
        $data = [
            'name' => $request->input('name'),
            'slug' => $request->input('slug'),
            'plan' => $request->input('plan', 'free'),
            'status' => 'active',
            'owner_email' => $request->input('ownerEmail', $request->input('owner_email')),
            'owner_name' => $request->input('ownerName', $request->input('owner_name')),
            'features' => $request->input('features', 'all'),
            'db_name' => 'tenant_' . $request->input('slug'),
        ];

        // Store default_language in stancl data column (defaults to 'vi')
        $defaultLang = $request->input('default_language', $request->input('defaultLanguage', 'vi'));
        $storageDriver = $request->input('storage_driver', 'public');
        $data['data'] = json_encode([
            'default_language' => $defaultLang,
            'storage_driver' => in_array($storageDriver, ['public', 's3', 'firebase', 'vstorage']) ? $storageDriver : 'public',
        ]);

        $tenant = $this->repo->store($data);
        return $this->successResponse($this->transformer->transform($tenant), 'Tenant created', 201);
    }

    public function update(Request $request, $id)
    {
        $data = array_filter([
            'name' => $request->input('name'),
            'plan' => $request->input('plan'),
            'owner_email' => $request->input('ownerEmail', $request->input('owner_email')),
            'owner_name' => $request->input('ownerName', $request->input('owner_name')),
            'custom_domain' => $request->input('custom_domain'),
            'logo' => $request->input('logo'),
            'features' => $request->input('features'),
        ], fn($v) => $v !== null);

        if (!empty($data)) {
            $this->repo->update($data, $id);
        }

        // Handle storage_driver (stored in Stancl data JSON column)
        $storageDriver = $request->input('storage_driver');
        if ($storageDriver !== null) {
            $tenant = $this->repo->findOne($id);
            $currentData = is_string($tenant->data) ? json_decode($tenant->data, true) : ($tenant->data ?? []);
            $currentData['storage_driver'] = in_array($storageDriver, ['public', 's3', 'firebase', 'vstorage']) ? $storageDriver : 'public';
            $this->repo->update(['data' => json_encode($currentData)], $id);
        }

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
