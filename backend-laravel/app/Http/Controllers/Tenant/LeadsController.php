<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Lead\LeadRepositoryInterface;
use App\Transformers\LeadTransformer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class LeadsController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeadRepositoryInterface $repo,
        private LeadTransformer $transformer,
    ) {}

    public function index()
    {
        return $this->successResponse($this->transformer->transformCollection($this->repo->getLeads()));
    }

    public function show($id)
    {
        $lead = $this->repo->find($id);
        return $lead ? $this->successResponse($this->transformer->transform($lead)) : $this->notFoundResponse('Lead not found');
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->transformer->transform($this->repo->find($id)), 'Lead updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Lead deleted');
    }

    public function pipelineStats()
    {
        return $this->successResponse($this->repo->getPipelineStats());
    }
}
