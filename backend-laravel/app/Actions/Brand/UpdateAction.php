<?php
namespace App\Actions\Brand;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $data = $request->except('translations');
        $this->repo->update($data, $id);

        if ($request->has('translations')) {
            $this->syncTranslations('brands', $id, $request->input('translations'));
        }

        return $this->successResponse($this->repo->find($id), 'Brand updated');
    }
}
