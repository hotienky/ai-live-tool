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

        // Stancl data column: default_language + storage settings
        $defaultLang = $request->input('default_language', $request->input('defaultLanguage', 'vi'));
        $storageDriver = $this->validateDriver($request->input('storage_driver', 'local'));

        $stancData = [
            'default_language' => $defaultLang,
            'storage_driver' => $storageDriver,
        ];

        // Merge storage_config if provided
        $storageConfig = $request->input('storage_config');
        if (is_array($storageConfig)) {
            $stancData['storage_config'] = $this->sanitizeStorageConfig($storageConfig);
        }

        $data['data'] = json_encode($stancData);

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

        // Handle storage settings (stored in Stancl data JSON column)
        $storageDriver = $request->input('storage_driver');
        $storageConfig = $request->input('storage_config');

        if ($storageDriver !== null || $storageConfig !== null) {
            $tenant = $this->repo->findOne($id);
            $currentData = is_string($tenant->data) ? json_decode($tenant->data, true) : ($tenant->data ?? []);

            if ($storageDriver !== null) {
                $currentData['storage_driver'] = $this->validateDriver($storageDriver);
            }
            if (is_array($storageConfig)) {
                // Merge: keep existing secrets if new values are masked (****)
                $existing = $currentData['storage_config'] ?? [];
                $currentData['storage_config'] = $this->mergeStorageConfig($existing, $storageConfig);
            }

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

    // ── Storage config helpers ──

    private function validateDriver(?string $driver): string
    {
        $allowed = ['local', 's3', 'firebase', 'vstorage'];
        return in_array($driver, $allowed) ? $driver : 'local';
    }

    private function sanitizeStorageConfig(array $config): array
    {
        $allowed = ['key', 'secret', 'region', 'bucket', 'endpoint', 'cdn_url'];
        return array_intersect_key($config, array_flip($allowed));
    }

    /**
     * Merge new config into existing config.
     * Keeps existing secret values if the new value looks masked (e.g. "****").
     */
    private function mergeStorageConfig(array $existing, array $new): array
    {
        $sanitized = $this->sanitizeStorageConfig($new);
        foreach ($sanitized as $key => $value) {
            // If the new value is masked (all asterisks), keep existing
            if (preg_match('/^\*+$/', $value ?? '') && !empty($existing[$key])) {
                $sanitized[$key] = $existing[$key];
            }
        }
        return array_merge($existing, $sanitized);
    }
}
