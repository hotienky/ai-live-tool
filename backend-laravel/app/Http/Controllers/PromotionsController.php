<?php

namespace App\Http\Controllers;

use App\Repositories\Promotion\PromotionRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PromotionsController extends Controller
{
    use ApiResponse;

    public function __construct(private PromotionRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        try {
            $promotion = $this->repo->store($request->all());
            return $this->successResponse($promotion, 'Promotion created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Promotion updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Promotion deleted');
    }
}
