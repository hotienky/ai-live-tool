<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Notification\NotificationRepositoryInterface;
use App\Transformers\NotificationTransformer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    use ApiResponse;

    public function __construct(
        private NotificationRepositoryInterface $repo,
        private NotificationTransformer $transformer,
    ) {}

    public function index(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        return $this->successResponse($this->transformer->transformCollection($this->repo->getForUser($userId)));
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        return $this->successResponse(['count' => $this->repo->getUnreadCount($userId)]);
    }

    public function markAsRead($id)
    {
        $this->repo->markAsRead($id);
        return $this->successResponse(null, 'Notification marked as read');
    }

    public function markAllAsRead(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $this->repo->markAllAsRead($userId);
        return $this->successResponse(null, 'All notifications marked as read');
    }
}
