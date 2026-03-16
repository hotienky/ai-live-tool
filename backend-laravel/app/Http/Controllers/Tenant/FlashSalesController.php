<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\FlashSale\FlashSaleRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class FlashSalesController extends Controller
{
    use ApiResponse;

    public function __construct(private FlashSaleRepositoryInterface $repo) {}

    public function index()
    {
        try {
            return $this->successResponse($this->repo->query()->orderByDesc('created_at')->get());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function show($id)
    {
        $sale = $this->repo->findOne($id);
        if (!$sale) return $this->notFoundResponse('Flash sale not found');
        return $this->successResponse($sale);
    }

    public function store(Request $request)
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
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $sale = $this->repo->findOne($id);
            if (!$sale) return $this->notFoundResponse('Flash sale not found');
            $this->repo->update($request->all(), $id);
            return $this->successResponse($this->repo->findOne($id));
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $sale = $this->repo->findOne($id);
            if (!$sale) return $this->notFoundResponse('Flash sale not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Flash sale deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function active()
    {
        try {
            return $this->successResponse($this->repo->getActive());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
