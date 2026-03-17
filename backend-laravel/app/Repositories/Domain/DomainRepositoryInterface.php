<?php

namespace App\Repositories\Domain;

use App\Repositories\BaseRepoInterface;

interface DomainRepositoryInterface extends BaseRepoInterface
{
    public function findByTenant(int|string $tenantId): array;

    public function findByTenantAndId(int|string $tenantId, int|string $domainId);

    public function storeForTenant(int|string $tenantId, array $data);

    public function getAllDomains(): array;
}
