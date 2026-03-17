<?php
namespace App\Actions\Coupon;

class DestroyAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Đã xóa mã giảm giá');
    }
}
