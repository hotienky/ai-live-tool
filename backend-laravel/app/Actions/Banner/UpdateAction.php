<?php
namespace App\Actions\Banner;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        try {
            $banner = $this->repo->find($id);
            if (!$banner) return $this->notFoundResponse('Banner not found');
            $this->repo->update($request->all(), $id);
            $this->logActivity('banner.updated', 'banner', $id);
            return $this->successResponse($this->repo->find($id), 'Banner updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
