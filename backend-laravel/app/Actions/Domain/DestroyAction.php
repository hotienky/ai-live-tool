<?php

namespace App\Actions\Domain;

use App\Repositories\Domain\DomainRepositoryInterface;
use App\Services\HostsFileSync;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Cache;

class DestroyAction
{
    use ApiResponse;

    public function __construct(
        private DomainRepositoryInterface $repo,
        private HostsFileSync $hostsSync,
    ) {}

    public function __invoke(int|string $tenantId, int|string $domainId)
    {
        try {
            $domain = $this->repo->findByTenantAndId($tenantId, $domainId);

            // Clear cache for this domain
            Cache::forget("custom_domain:{$domain->domain}");

            $domain->delete();

            // Auto-sync /etc/hosts for local development
            $this->hostsSync->sync($this->repo->getAllDomains());

            return $this->successResponse(null, 'Domain removed');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
