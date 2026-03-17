<?php
namespace App\Actions\Category;

class ShowAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $category = $this->repo->find($id);
        if (!$category) return $this->notFoundResponse('Category not found');
        return $this->successResponse($category);
    }
}
