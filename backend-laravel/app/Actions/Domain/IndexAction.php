<?php

namespace App\Actions\Domain;

use App\Repositories\Domain\DomainRepositoryInterface;
use App\Traits\ApiResponse;

class IndexAction
{
    use ApiResponse;

    public function __construct(private DomainRepositoryInterface $repo) {}

    public function __invoke(int|string $tenantId)
    {
        try {
            $domains = $this->repo->findByTenant($tenantId);

            return $this->successResponse($domains);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
