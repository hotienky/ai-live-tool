<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\ShopCustomer\ShopCustomerRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ShopCustomersController extends Controller
{
    use ApiResponse;

    public function __construct(private ShopCustomerRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $customer = $this->repo->find($id);
        return $customer ? $this->successResponse($customer) : $this->notFoundResponse('Customer not found');
    }

    public function store(Request $request)
    {
        try {
            $customer = $this->repo->store($request->all());
            return $this->successResponse($customer, 'Customer created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
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

    public function listAddresses($customerId)
    {
        return $this->successResponse($this->repo->getAddresses($customerId));
    }

    public function addAddress(Request $request, $customerId)
    {
        try {
            $address = $this->repo->createAddress($customerId, $request->all());
            return $this->successResponse($address, 'Address created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function updateAddress(Request $request, $customerId, $id)
    {
        $address = $this->repo->updateAddress($customerId, $id, $request->all());
        return $this->successResponse($address, 'Address updated');
    }

    public function deleteAddress($customerId, $id)
    {
        $this->repo->deleteAddress($customerId, $id);
        return $this->successResponse(null, 'Address deleted');
    }
}
