<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Traits\ApiResponse;
use App\Repositories\Lead\LeadRepositoryInterface;
use App\Repositories\Customer\CustomerRepositoryInterface;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeadRepositoryInterface $leadRepo,
        private CustomerRepositoryInterface $customerRepo,
    ) {}

    public function leads()
    {
        return $this->successResponse($this->leadRepo->all());
    }

    public function comments()
    {
        // chat_logs doesn't have a dedicated repository — using DB as read-only export
        return $this->successResponse(DB::table('chat_logs')->orderByDesc('created_at')->limit(500)->get());
    }

    public function customers()
    {
        return $this->successResponse($this->customerRepo->all());
    }

    public function report()
    {
        return $this->successResponse(['message' => 'Report generated']);
    }
}
