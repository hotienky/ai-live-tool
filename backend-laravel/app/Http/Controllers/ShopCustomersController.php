<?php

namespace App\Http\Controllers;

use App\Repositories\ShopCustomer\ShopCustomerRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function addresses($id)
    {
        return $this->successResponse(DB::table('shop_customer_addresses')->where('shop_customer_id', $id)->get());
    }

    public function storeAddress(Request $request, $id)
    {
        try {
            $data = $request->all();
            $data['shop_customer_id'] = $id;
            $data['created_at'] = now();
            $addrId = DB::table('shop_customer_addresses')->insertGetId($data);
            return $this->successResponse(DB::table('shop_customer_addresses')->where('id', $addrId)->first(), 'Address created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function updateAddress(Request $request, $id, $addressId)
    {
        DB::table('shop_customer_addresses')->where('id', $addressId)->where('shop_customer_id', $id)->update($request->all());
        return $this->successResponse(DB::table('shop_customer_addresses')->where('id', $addressId)->first(), 'Address updated');
    }

    public function deleteAddress($id, $addressId)
    {
        DB::table('shop_customer_addresses')->where('id', $addressId)->where('shop_customer_id', $id)->delete();
        return $this->successResponse(null, 'Address deleted');
    }
}
