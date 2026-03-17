<?php
namespace App\Actions\Brand;

class DestroyAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Brand deleted');
    }
}
