<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Customer\CustomerRepositoryInterface;
use App\Transformers\CustomerTransformer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CustomersController extends Controller
{
    use ApiResponse;

    public function __construct(
        private CustomerRepositoryInterface $repo,
        private CustomerTransformer $transformer,
    ) {}

    public function index()
    {
        return $this->successResponse($this->transformer->transformCollection($this->repo->all()));
    }

    public function show($id)
    {
        $customer = $this->repo->find($id);
        return $customer ? $this->successResponse($this->transformer->transform($customer)) : $this->notFoundResponse('Customer not found');
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->transformer->transform($this->repo->find($id)), 'Customer updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Customer deleted');
    }
}
