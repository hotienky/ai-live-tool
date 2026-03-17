<?php
namespace App\Actions\FlashSale;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        try {
            $sale = $this->repo->findOne($id);
            if (!$sale) return $this->notFoundResponse('Flash sale not found');
            $this->repo->update($request->all(), $id);
            return $this->successResponse($this->repo->findOne($id));
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
