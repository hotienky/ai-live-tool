<?php
namespace App\Actions\FlashSale;

class ShowAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $sale = $this->repo->findOne($id);
        if (!$sale) return $this->notFoundResponse('Flash sale not found');
        return $this->successResponse($sale);
    }
}
