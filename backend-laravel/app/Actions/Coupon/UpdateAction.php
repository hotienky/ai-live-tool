<?php
namespace App\Actions\Coupon;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        try {
            $data = $this->mapCouponFields($request);
            $this->repo->update($data, $id);
            return $this->successResponse($this->repo->findOne($id), 'Đã cập nhật');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
