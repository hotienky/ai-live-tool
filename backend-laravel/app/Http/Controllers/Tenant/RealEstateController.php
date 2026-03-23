<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\PropertyInquiry;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RealEstateController extends Controller
{
    use ApiResponse;

    // ── Stats ──

    public function stats()
    {
        $total    = Content::where('type', 'listing')->count();
        $active   = Content::where('type', 'listing')->where('status', 'published')->count();
        $inquiries = PropertyInquiry::count();
        $pending  = PropertyInquiry::where('status', 'pending')->count();

        return $this->successResponse(compact('total', 'active', 'inquiries', 'pending'));
    }

    // ── Inquiries ──

    public function inquiries(Request $request)
    {
        $query = PropertyInquiry::query();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        return $this->successResponse(
            $query->orderByDesc('created_at')->paginate($request->input('per_page', 20))
        );
    }

    public function showInquiry($id)
    {
        return $this->successResponse(PropertyInquiry::findOrFail($id));
    }

    public function updateInquiry(Request $request, $id)
    {
        $inquiry = PropertyInquiry::findOrFail($id);
        $data = $request->validate([
            'status'      => 'sometimes|in:pending,contacted,closed',
            'admin_notes' => 'nullable|string',
        ]);

        $inquiry->update($data);

        return $this->successResponse($inquiry, 'Đã cập nhật');
    }

    public function destroyInquiry($id)
    {
        PropertyInquiry::findOrFail($id)->delete();

        return $this->successResponse(null, 'Đã xoá');
    }
}
