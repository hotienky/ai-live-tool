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

    /** Danh sách thông báo (có phân trang + filter theo type) */
    public function index(Request $request)
    {
        $userId  = $request->attributes->get('auth_user')->id ?? 0;
        $type    = $request->query('type');
        $perPage = min((int) $request->query('per_page', 20), 100);

        $paginated = $this->repo->getForUser($userId, $type, $perPage);

        return $this->successResponse([
            'data' => $this->transformer->transformCollection($paginated->items()),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    /** Số thông báo chưa đọc */
    public function unreadCount(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        return $this->successResponse(['count' => $this->repo->getUnreadCount($userId)]);
    }

    /** Đánh dấu 1 thông báo đã đọc */
    public function markAsRead(Request $request, int $id)
    {
        $this->repo->markAsRead($id);
        return $this->successResponse(null, 'Notification marked as read');
    }

    /** Đánh dấu tất cả đã đọc */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $this->repo->markAllAsRead($userId);
        return $this->successResponse(null, 'All notifications marked as read');
    }

    /** Xóa 1 thông báo */
    public function destroy(Request $request, int $id)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $deleted = $this->repo->deleteForUser($id, $userId);

        if (!$deleted) {
            return $this->errorResponse('Notification not found', 404);
        }

        return $this->successResponse(null, 'Notification deleted');
    }

    /** Xóa tất cả thông báo đã đọc */
    public function destroyRead(Request $request)
    {
        $userId = $request->attributes->get('auth_user')->id ?? 0;
        $count  = $this->repo->deleteAllReadForUser($userId);
        return $this->successResponse(['deleted' => $count], 'Read notifications cleared');
    }
}
