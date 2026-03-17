<?php
namespace App\Actions\Brand;

use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Brand updated');
    }
}
