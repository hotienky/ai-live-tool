<?php

namespace App\Actions\Domain;

use App\Repositories\Domain\DomainRepositoryInterface;
use App\Services\HostsFileSync;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class StoreAction
{
    use ApiResponse;

    public function __construct(
        private DomainRepositoryInterface $repo,
        private HostsFileSync $hostsSync,
    ) {}

    public function __invoke(Request $request, int|string $tenantId)
    {
        try {
            $data = $request->validate([
                'domain' => 'required|string|max:255|unique:domains,domain',
                'type' => 'in:storefront,cms',
            ]);

            $domain = $this->repo->storeForTenant($tenantId, [
                'domain' => strtolower(trim($data['domain'])),
                'type' => $data['type'] ?? 'storefront',
                'is_primary' => $request->input('is_primary', false),
            ]);

            // Auto-sync /etc/hosts for local development
            $this->hostsSync->sync($this->repo->getAllDomains());

            return $this->successResponse([
                'id' => $domain->id,
                'domain' => $domain->domain,
                'type' => $domain->type ?? 'storefront',
                'is_primary' => (bool) ($domain->is_primary ?? false),
            ], 'Domain added', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
