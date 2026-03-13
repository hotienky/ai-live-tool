<?php

namespace App\Http\Controllers;

use App\Repositories\Webhook\WebhookRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class WebhooksController extends Controller
{
    use ApiResponse;

    public function __construct(private WebhookRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        $webhook = $this->repo->store($request->all());
        return $this->successResponse($webhook, 'Webhook created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Webhook deleted');
    }
}
