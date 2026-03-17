<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Repositories\Subscriber\SubscriberRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class NewsletterController extends Controller
{
    use ApiResponse;

    public function __construct(private SubscriberRepositoryInterface $repo) {}

    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
        ]);

        try {
            $result = $this->repo->subscribe($data);

            if (is_array($result) && ($result['already_subscribed'] ?? false)) {
                return $this->successResponse(null, 'Bạn đã đăng ký nhận tin rồi!');
            }

            $code = is_array($result) && ($result['resubscribed'] ?? false) ? 200 : 201;
            return $this->successResponse(null, 'Đăng ký nhận tin thành công!', $code);
        } catch (\Exception $e) {
            return $this->errorResponse('Không thể đăng ký. Vui lòng thử lại.');
        }
    }

    public function unsubscribe(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);
        $this->repo->unsubscribe($data['email']);
        return $this->successResponse(null, 'Đã hủy đăng ký nhận tin.');
    }

    public function index()
    {
        $subscribers = $this->repo->query()->orderBy('created_at', 'desc')->paginate(50);
        return $this->successResponse($subscribers);
    }
}
