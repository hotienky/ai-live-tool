<?php
namespace App\Actions\Coupon;

use Illuminate\Http\Request;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $this->mapCouponFields($request);
            if (empty($data['code'])) return $this->errorResponse('Chưa nhập mã code');
            $coupon = $this->repo->store($data);
            return $this->successResponse($coupon, 'Đã tạo mã giảm giá', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
