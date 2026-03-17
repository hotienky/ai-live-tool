<?php
namespace App\Actions\FlashSale;

class DestroyAction extends BaseAction
{
    public function __invoke(int $id)
    {
        try {
            $sale = $this->repo->findOne($id);
            if (!$sale) return $this->notFoundResponse('Flash sale not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Flash sale deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
