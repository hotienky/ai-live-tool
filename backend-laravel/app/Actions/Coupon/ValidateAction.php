<?php
namespace App\Actions\Coupon;

use Illuminate\Http\Request;

class ValidateAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        $result = $this->repo->validateCoupon(
            $request->input('code'),
            $request->input('order_total', 0)
        );
        return $this->successResponse($result);
    }
}
