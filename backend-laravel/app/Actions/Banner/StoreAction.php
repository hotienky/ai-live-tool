<?php
namespace App\Actions\Banner;

use Illuminate\Http\Request;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'image_url' => 'required|string',
                'link_url' => 'nullable|string',
                'position' => 'nullable|string|max:50',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
            ]);
            $banner = $this->repo->store($data);
            $this->logActivity('banner.created', 'banner', $banner->id, ['title' => $data['title']]);
            return $this->successResponse($banner, 'Banner created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
