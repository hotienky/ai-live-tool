<?php

namespace App\Http\Controllers;

use App\Repositories\Customer\CustomerRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CustomersController extends Controller
{
    use ApiResponse;

    public function __construct(private CustomerRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $customer = $this->repo->find($id);
        return $customer ? $this->successResponse($customer) : $this->notFoundResponse('Customer not found');
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Customer updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Customer deleted');
    }
}
