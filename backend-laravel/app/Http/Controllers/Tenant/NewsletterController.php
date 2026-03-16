<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NewsletterController extends Controller
{
    use ApiResponse;

    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
        ]);

        try {
            $existing = DB::table('subscribers')->where('email', $data['email'])->first();

            if ($existing) {
                if ($existing->is_active) {
                    return $this->successResponse(null, 'Bạn đã đăng ký nhận tin rồi!');
                }
                // Re-subscribe
                DB::table('subscribers')->where('id', $existing->id)->update([
                    'is_active' => true,
                    'unsubscribed_at' => null,
                    'subscribed_at' => now(),
                    'updated_at' => now(),
                ]);
                return $this->successResponse(null, 'Đăng ký nhận tin thành công!');
            }

            DB::table('subscribers')->insert([
                'email' => $data['email'],
                'name' => $data['name'] ?? null,
                'source' => 'newsletter',
                'is_active' => true,
                'subscribed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->successResponse(null, 'Đăng ký nhận tin thành công!', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Không thể đăng ký. Vui lòng thử lại.');
        }
    }

    public function unsubscribe(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);

        DB::table('subscribers')->where('email', $data['email'])->update([
            'is_active' => false,
            'unsubscribed_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->successResponse(null, 'Đã hủy đăng ký nhận tin.');
    }

    public function index()
    {
        $subscribers = DB::table('subscribers')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return $this->successResponse($subscribers);
    }
}
