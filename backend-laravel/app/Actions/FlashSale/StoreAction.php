<?php
namespace App\Actions\FlashSale;

use App\Traits\HasContentTranslations;
use Illuminate\Http\Request;

class StoreAction extends BaseAction
{
    use HasContentTranslations;

    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'start_time' => 'nullable|date',
                'end_time' => 'nullable|date',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'is_active' => 'nullable|boolean',
                'products' => 'nullable|array',
                'discount_type' => 'nullable|string|in:percentage,fixed',
                'discount_value' => 'nullable|numeric|min:0',
            ]);

            // Accept both start_date/end_date (frontend) and start_time/end_time (legacy)
            if (empty($data['start_time']) && !empty($data['start_date'])) {
                $data['start_time'] = $data['start_date'];
            }
            if (empty($data['end_time']) && !empty($data['end_date'])) {
                $data['end_time'] = $data['end_date'];
            }

            $flashSale = $this->repo->store($data);

            if ($request->has('translations')) {
                $this->syncTranslations('flash_sales', $flashSale->id, $request->input('translations'));
            }

            return $this->successResponse($flashSale, 'Flash sale created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
