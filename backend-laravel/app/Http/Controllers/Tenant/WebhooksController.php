<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Webhook\WebhookRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class WebhooksController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(private WebhookRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        $webhook = $this->repo->store($request->all());
        $this->logActivity('webhook.created', 'webhook', $webhook->id, ['name' => $webhook->name ?? null]);
        return $this->successResponse($webhook, 'Webhook created', 201);
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        $this->logActivity('webhook.updated', 'webhook', $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->logActivity('webhook.deleted', 'webhook', $id);
        $this->repo->delete($id);
        return $this->successResponse(null, 'Webhook deleted');
    }
}
