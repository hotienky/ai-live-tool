<?php
namespace App\Actions\Banner;

class ShowAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $banner = $this->repo->find($id);
        if (!$banner) return $this->notFoundResponse('Banner not found');
        return $this->successResponse($banner);
    }
}
