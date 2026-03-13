<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Shop\ShopRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ShopsController extends Controller
{
    use ApiResponse;

    public function __construct(private ShopRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function show($id)
    {
        $shop = $this->repo->find($id);
        return $shop ? $this->successResponse($shop) : $this->notFoundResponse('Shop not found');
    }

    public function store(Request $request)
    {
        try {
            $shop = $this->repo->store($request->all());
            return $this->successResponse($shop, 'Shop created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->find($id), 'Shop updated');
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Shop deleted');
    }

    public function findOrCreate(Request $request)
    {
        try {
            $shop = $this->repo->findOrCreate($request->input('platform'), $request->input('shop_id'), $request->all());
            return $this->successResponse($shop);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function connect(Request $request, $id)
    {
        $this->repo->update([
            'is_connected' => true,
            'access_token' => $request->input('access_token'),
            'updated_at' => now(),
        ], $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function disconnect($id)
    {
        $this->repo->update([
            'is_connected' => false,
            'access_token' => null,
            'updated_at' => now(),
        ], $id);
        return $this->successResponse($this->repo->findOne($id));
    }
}
