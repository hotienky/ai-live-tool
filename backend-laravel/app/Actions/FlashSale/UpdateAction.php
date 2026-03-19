<?php
namespace App\Actions\FlashSale;

use App\Traits\HasContentTranslations;
use Illuminate\Http\Request;

class UpdateAction extends BaseAction
{
    use HasContentTranslations;

    public function __invoke(Request $request, int $id)
    {
        try {
            $sale = $this->repo->findOne($id);
            if (!$sale) return $this->notFoundResponse('Flash sale not found');
            $this->repo->update($request->except('translations'), $id);

            if ($request->has('translations')) {
                $this->syncTranslations('flash_sales', $id, $request->input('translations'));
            }

            return $this->successResponse($this->repo->findOne($id));
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
