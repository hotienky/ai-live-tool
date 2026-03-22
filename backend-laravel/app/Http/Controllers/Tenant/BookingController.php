<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\BookingService;
use App\Models\BookingAppointment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    use ApiResponse;

    // ── Services ──

    public function services(Request $request)
    {
        $query = BookingService::query();
        if ($search = $request->input('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }
        return $this->successResponse($query->orderBy('sort_order')->paginate($request->input('per_page', 20)));
    }

    public function storeService(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'integer|min:1',
            'buffer_minutes' => 'integer|min:0',
            'price' => 'numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'working_hours' => 'nullable|array',
            'max_bookings_per_slot' => 'integer|min:1',
        ]);
        return $this->successResponse(BookingService::create($data), 'Đã tạo dịch vụ', 201);
    }

    public function showService($id)
    {
        return $this->successResponse(BookingService::with('appointments')->findOrFail($id));
    }

    public function updateService(Request $request, $id)
    {
        $service = BookingService::findOrFail($id);
        $service->update($request->only([
            'title', 'description', 'duration_minutes', 'buffer_minutes', 'price',
            'is_active', 'image', 'sort_order', 'category', 'working_hours', 'max_bookings_per_slot',
        ]));
        return $this->successResponse($service, 'Đã cập nhật');
    }

    public function destroyService($id)
    {
        BookingService::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Appointments ──

    public function appointments(Request $request)
    {
        $query = BookingAppointment::with('service');
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($date = $request->input('date')) $query->whereDate('date', $date);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'ilike', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }
        return $this->successResponse($query->orderBy('date', 'desc')->orderBy('time_slot')->paginate($request->input('per_page', 20)));
    }

    public function storeAppointment(Request $request)
    {
        $data = $request->validate([
            'service_id' => 'required|exists:booking_services,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email',
            'date' => 'required|date',
            'time_slot' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $service = BookingService::findOrFail($data['service_id']);
        $data['total_price'] = $service->price;
        return $this->successResponse(BookingAppointment::create($data), 'Đã tạo lịch hẹn', 201);
    }

    public function showAppointment($id)
    {
        return $this->successResponse(BookingAppointment::with('service')->findOrFail($id));
    }

    public function updateAppointment(Request $request, $id)
    {
        $apt = BookingAppointment::findOrFail($id);
        $newStatus = $request->input('status');

        // Handle status transitions with timestamps
        if ($newStatus && $newStatus !== $apt->status) {
            if ($newStatus === 'confirmed') $apt->confirmed_at = now();
            if ($newStatus === 'cancelled') {
                $apt->cancelled_at = now();
                $apt->cancellation_reason = $request->input('cancellation_reason');
            }
        }

        $apt->update($request->only(['customer_name', 'customer_phone', 'customer_email', 'date', 'time_slot', 'status', 'notes']));
        return $this->successResponse($apt->load('service'), 'Đã cập nhật');
    }

    public function destroyAppointment($id)
    {
        BookingAppointment::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Calendar view ──

    public function calendar(Request $request)
    {
        $start = $request->input('start', now()->startOfMonth()->format('Y-m-d'));
        $end = $request->input('end', now()->endOfMonth()->format('Y-m-d'));
        $appointments = BookingAppointment::with('service')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date')->orderBy('time_slot')
            ->get();
        return $this->successResponse($appointments);
    }

    // ── Stats Dashboard ──

    public function stats()
    {
        $totalAppointments = BookingAppointment::count();
        $todayAppointments = BookingAppointment::whereDate('date', today())->count();
        $pending = BookingAppointment::where('status', 'pending')->count();
        $revenue = BookingAppointment::where('status', 'completed')->sum('total_price');
        $topServices = BookingService::withCount('appointments')->orderBy('appointments_count', 'desc')->limit(5)->get(['id', 'title', 'price']);
        $byStatus = BookingAppointment::selectRaw('status, count(*) as count')
            ->groupBy('status')->pluck('count', 'status');

        return $this->successResponse(compact(
            'totalAppointments', 'todayAppointments', 'pending', 'revenue', 'topServices', 'byStatus'
        ));
    }
}
