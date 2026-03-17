<?php
namespace App\Actions\FlashSale;

class ActiveAction extends BaseAction
{
    public function __invoke()
    {
        try {
            return $this->successResponse($this->repo->getActive());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
