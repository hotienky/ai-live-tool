<?php
namespace App\Actions\Category;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $data = $request->except('translations');
        $this->repo->update($data, $id);
        $this->logActivity('category.updated', 'category', $id);

        if ($request->has('translations')) {
            $this->syncTranslations('categories', $id, $request->input('translations'));
        }

        return $this->successResponse($this->repo->find($id), 'Category updated');
    }
}
