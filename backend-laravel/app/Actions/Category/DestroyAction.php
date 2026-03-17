<?php
namespace App\Actions\Category;

class DestroyAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $this->logActivity('category.deleted', 'category', $id);
        $this->repo->delete($id);
        return $this->successResponse(null, 'Category deleted');
    }
}
