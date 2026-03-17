<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Stancl\Tenancy\Database\Models\Domain;

class DomainController extends Controller
{
    use ApiResponse;

    public function index($tenantId)
    {
        $tenant = Tenant::findOrFail($tenantId);

        return $this->successResponse(
            $tenant->domains->map(fn ($d) => [
                'id' => $d->id,
                'domain' => $d->domain,
                'type' => $d->type ?? 'storefront',
                'is_primary' => (bool) ($d->is_primary ?? false),
                'verified_at' => $d->verified_at,
                'created_at' => $d->created_at,
            ])
        );
    }

    public function store(Request $request, $tenantId)
    {
        $tenant = Tenant::findOrFail($tenantId);

        $request->validate([
            'domain' => 'required|string|max:255|unique:master.domains,domain',
            'type' => 'in:storefront,cms',
        ]);

        $domain = $tenant->domains()->create([
            'domain' => strtolower(trim($request->input('domain'))),
            'type' => $request->input('type', 'storefront'),
            'is_primary' => $request->input('is_primary', false),
        ]);

        return $this->successResponse([
            'id' => $domain->id,
            'domain' => $domain->domain,
            'type' => $domain->type ?? 'storefront',
            'is_primary' => (bool) ($domain->is_primary ?? false),
        ], 'Domain added', 201);
    }

    public function destroy($tenantId, $domainId)
    {
        $domain = Domain::where('tenant_id', $tenantId)->findOrFail($domainId);

        // Clear cache for this domain
        Cache::forget("custom_domain:{$domain->domain}");

        $domain->delete();

        return $this->successResponse(null, 'Domain removed');
    }
}
