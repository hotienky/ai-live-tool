<?php
namespace App\Actions\FlashSale;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        try {
            return $this->successResponse($this->repo->query()->orderByDesc('created_at')->get());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
