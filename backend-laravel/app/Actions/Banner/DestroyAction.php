<?php
namespace App\Actions\Banner;

class DestroyAction extends BaseAction
{
    public function __invoke(int $id)
    {
        try {
            $banner = $this->repo->find($id);
            if (!$banner) return $this->notFoundResponse('Banner not found');
            $this->logActivity('banner.deleted', 'banner', $id, ['title' => $banner->title ?? null]);
            $this->repo->delete($id);
            return $this->successResponse(null, 'Banner deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
