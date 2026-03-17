<?php
namespace App\Actions\Category;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $this->repo->update($request->all(), $id);
        $this->logActivity('category.updated', 'category', $id);
        return $this->successResponse($this->repo->find($id), 'Category updated');
    }
}
