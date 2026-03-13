<?php
namespace App\Actions\Product;

use Illuminate\Http\Request;

class AdjustStockAction extends BaseAction
{
    public function __invoke(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'quantity' => 'required|integer',
                'reason' => 'nullable|string',
            ]);

            $user = $request->attributes->get('auth_user');
            $stockAfter = $this->productRepository->adjustStock($id, $data['quantity'], $user->id ?? null, $data['reason'] ?? null);

            return $this->successResponse(['stock' => $stockAfter], 'Stock adjusted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
