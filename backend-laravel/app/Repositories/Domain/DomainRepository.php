<?php

namespace App\Repositories\Domain;

use App\Models\Tenant;
use App\Repositories\BaseEloquentRepository;
use Stancl\Tenancy\Database\Models\Domain;

class DomainRepository extends BaseEloquentRepository implements DomainRepositoryInterface
{
    public function __construct(Domain $model)
    {
        parent::__construct($model);
    }

    public function findByTenant(int|string $tenantId): array
    {
        $tenant = Tenant::findOrFail((string) $tenantId);

        return $tenant->domains->map(fn ($d) => [
            'id' => $d->id,
            'domain' => $d->domain,
            'type' => $d->type ?? 'storefront',
            'is_primary' => (bool) ($d->is_primary ?? false),
            'verified_at' => $d->verified_at,
            'created_at' => $d->created_at,
        ])->toArray();
    }

    public function findByTenantAndId(int|string $tenantId, int|string $domainId)
    {
        return $this->model->where('tenant_id', (string) $tenantId)->findOrFail($domainId);
    }

    public function storeForTenant(int|string $tenantId, array $data)
    {
        $tenant = Tenant::findOrFail((string) $tenantId);

        return $tenant->domains()->create($data);
    }

    public function getAllDomains(): array
    {
        return $this->model->pluck('domain')->unique()->values()->toArray();
    }
}
