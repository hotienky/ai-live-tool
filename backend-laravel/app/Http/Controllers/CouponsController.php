<?php

namespace App\Http\Controllers;

use App\Repositories\Coupon\CouponRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CouponsController extends Controller
{
    use ApiResponse;

    public function __construct(private CouponRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->query()->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $coupon = $this->repo->store($request->all());
        return $this->successResponse($coupon, 'Coupon created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Coupon deleted');
    }

    public function validate(Request $request)
    {
        $result = $this->repo->validateCoupon(
            $request->input('code'),
            $request->input('order_total', 0)
        );
        return $this->successResponse($result);
    }
}
