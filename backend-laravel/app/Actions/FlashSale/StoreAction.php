<?php
namespace App\Actions\FlashSale;

use Illuminate\Http\Request;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'start_time' => 'required|date',
                'end_time' => 'required|date|after:start_time',
                'is_active' => 'nullable|boolean',
                'products' => 'nullable|array',
                'discount_type' => 'nullable|string|in:percentage,fixed',
                'discount_value' => 'nullable|numeric|min:0',
            ]);
            $flashSale = $this->repo->store($data);
            return $this->successResponse($flashSale, 'Flash sale created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
