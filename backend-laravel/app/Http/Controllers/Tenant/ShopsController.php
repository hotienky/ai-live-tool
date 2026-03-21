<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Shop\ShopRepositoryInterface;
use App\Transformers\ShopTransformer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ShopsController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ShopRepositoryInterface $repo,
        private ShopTransformer $transformer,
    ) {}

    public function index()
    {
        try {
            return $this->successResponse($this->transformer->transformCollection($this->repo->all()));
        } catch (\Exception $e) {
            return $this->successResponse([]);
        }
    }

    public function show($id)
    {
        $shop = $this->repo->find($id);
        return $shop ? $this->successResponse($this->transformer->transform($shop)) : $this->notFoundResponse('Shop not found');
    }

    public function store(Request $request)
    {
        try {
            $shop = $this->repo->store($request->all());
            return $this->successResponse($this->transformer->transform($shop), 'Shop created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->transformer->transform($this->repo->find($id)), 'Shop updated');
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
            return $this->successResponse($this->transformer->transform($shop));
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
        return $this->successResponse($this->transformer->transform($this->repo->findOne($id)));
    }

    public function disconnect($id)
    {
        $this->repo->update([
            'is_connected' => false,
            'access_token' => null,
            'updated_at' => now(),
        ], $id);
        return $this->successResponse($this->transformer->transform($this->repo->findOne($id)));
    }
}
