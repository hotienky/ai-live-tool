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
        return $this->successResponse($this->repo->query()->orderByDesc('created_at')->get());
    }

    public function show($id)
    {
        return $this->successResponse($this->repo->findOne($id));
    }

    public function store(Request $request)
    {
        $flashSale = $this->repo->store($request->all());
        return $this->successResponse($flashSale, 'Flash sale created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Flash sale deleted');
    }

    public function active()
    {
        return $this->successResponse($this->repo->getActive());
    }
}
