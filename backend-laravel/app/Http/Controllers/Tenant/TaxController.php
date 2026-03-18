<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Repositories\Tax\TaxRateRepositoryInterface;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use App\Services\TaxService;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class TaxController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(
        private TaxRateRepositoryInterface $taxRateRepo,
        private SystemConfigRepositoryInterface $configRepo,
        private TaxService $taxService,
    ) {}

    /* ─── Tax Rates CRUD ─── */

    public function index()
    {
        return $this->successResponse($this->taxRateRepo->all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:tax_rates,code',
            'rate' => 'required|numeric|min:0',
            'type' => 'in:percentage,fixed',
            'scope' => 'in:global,category,product,region',
            'applies_to' => 'nullable|array',
            'is_compound' => 'boolean',
            'priority' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $rate = $this->taxRateRepo->store($data);
        $this->logActivity('tax_rate.created', 'tax_rate', $rate->id, ['name' => $rate->name]);
        return $this->successResponse($rate, 'Tax rate created', 201);
    }

    public function show($id)
    {
        $rate = $this->taxRateRepo->find($id);
        if (!$rate) return $this->errorResponse('Tax rate not found', 404);
        return $this->successResponse($rate);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:100|unique:tax_rates,code,' . $id,
            'rate' => 'sometimes|numeric|min:0',
            'type' => 'in:percentage,fixed',
            'scope' => 'in:global,category,product,region',
            'applies_to' => 'nullable|array',
            'is_compound' => 'boolean',
            'priority' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $this->taxRateRepo->update($data, $id);
        $this->logActivity('tax_rate.updated', 'tax_rate', $id);
        return $this->successResponse($this->taxRateRepo->find($id), 'Tax rate updated');
    }

    public function destroy($id)
    {
        $this->logActivity('tax_rate.deleted', 'tax_rate', $id);
        $this->taxRateRepo->delete($id);
        return $this->successResponse(null, 'Tax rate deleted');
    }

    /* ─── Tax Config ─── */

    public function getConfig()
    {
        return $this->successResponse($this->taxService->getAllConfig());
    }

    public function updateConfig(Request $request)
    {
        $data = $request->validate([
            'enabled' => 'sometimes|string|in:true,false',
            'price_includes_tax' => 'sometimes|string|in:true,false',
            'default_rate_id' => 'sometimes|nullable|string',
            'display_mode' => 'sometimes|string|in:inclusive,exclusive,both',
            'label' => 'sometimes|string|max:50',
            'rounding' => 'sometimes|string|in:round,ceil,floor',
        ]);

        $items = [];
        foreach ($data as $key => $value) {
            $items[] = ['key' => $key, 'value' => $value];
        }
        $this->configRepo->updateGroup('tax', $items);

        $this->logActivity('tax_config.updated', 'tax_config', null);
        return $this->successResponse($this->taxService->getAllConfig(), 'Tax config updated');
    }

    /* ─── Tax Preview (for storefront) ─── */

    public function preview(Request $request)
    {
        $data = $request->validate([
            'items' => 'required|array',
            'province_id' => 'nullable|integer',
        ]);

        $result = $this->taxService->previewTax(
            $data['items'],
            $data['province_id'] ?? null
        );

        return $this->successResponse($result);
    }
}
