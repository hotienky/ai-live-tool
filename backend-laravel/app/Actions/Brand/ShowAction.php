<?php
namespace App\Actions\Brand;

class ShowAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $brand = $this->repo->find($id);
        if (!$brand) return $this->notFoundResponse('Brand not found');
        return $this->successResponse($brand);
    }
}
