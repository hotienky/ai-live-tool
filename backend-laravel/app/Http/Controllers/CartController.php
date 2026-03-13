<?php

namespace App\Http\Controllers;

use App\Repositories\Cart\CartRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use ApiResponse;

    public function __construct(private CartRepositoryInterface $repo) {}

    public function index(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        return $this->successResponse($this->repo->getByUserId($userId));
    }

    public function addItem(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $item = $this->repo->addItem($userId, $request->all());
        return $this->successResponse($item, 'Item added to cart', 201);
    }

    public function updateItem(Request $request, $productId)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $item = $this->repo->updateItem($userId, $productId, $request->only(['quantity']));
        return $this->successResponse($item);
    }

    public function removeItem(Request $request, $productId)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $this->repo->removeItem($userId, $productId);
        return $this->successResponse(null, 'Item removed from cart');
    }
}
