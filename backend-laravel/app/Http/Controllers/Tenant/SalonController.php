<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\SalonService;
use App\Models\SalonStaff;
use App\Models\SalonAppointment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SalonController extends Controller
{
    use ApiResponse;

    // ── Services ──

    public function services(Request $request)
    {
        $query = SalonService::query();
        if ($search = $request->input('search')) $query->where('name', 'ilike', "%{$search}%");
        return $this->successResponse($query->orderBy('sort_order')->paginate($request->input('per_page', 50)));
    }

    public function storeService(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'integer|min:1',
            'price' => 'numeric|min:0',
            'category' => 'nullable|string|max:100',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
        ]);
        return $this->successResponse(SalonService::create($data), 'Đã tạo dịch vụ', 201);
    }

    public function showService($id)
    {
        return $this->successResponse(SalonService::with('staff')->findOrFail($id));
    }

    public function updateService(Request $request, $id)
    {
        $svc = SalonService::findOrFail($id);
        $svc->update($request->only([
            'name', 'description', 'duration_minutes', 'price', 'category',
            'image', 'is_active', 'is_popular', 'sort_order',
        ]));
        return $this->successResponse($svc, 'Đã cập nhật');
    }

    public function destroyService($id)
    {
        SalonService::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Staff ──

    public function staff(Request $request)
    {
        $query = SalonStaff::withCount('appointments');
        if ($search = $request->input('search')) $query->where('name', 'ilike', "%{$search}%");
        return $this->successResponse($query->orderBy('name')->paginate($request->input('per_page', 50)));
    }

    public function storeStaff(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'avatar' => 'nullable|string',
            'specialties' => 'nullable|array',
            'working_hours' => 'nullable|array',
            'is_active' => 'boolean',
        ]);
        return $this->successResponse(SalonStaff::create($data), 'Đã thêm nhân viên', 201);
    }

    public function showStaff($id)
    {
        return $this->successResponse(SalonStaff::withCount('appointments')->with('services')->findOrFail($id));
    }

    public function updateStaff(Request $request, $id)
    {
        $staff = SalonStaff::findOrFail($id);
        $staff->update($request->only(['name', 'phone', 'email', 'avatar', 'specialties', 'working_hours', 'is_active']));
        return $this->successResponse($staff, 'Đã cập nhật');
    }

    public function destroyStaff($id)
    {
        SalonStaff::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Appointments ──

    public function appointments(Request $request)
    {
        $query = SalonAppointment::with(['service', 'staff']);
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($date = $request->input('date')) $query->whereDate('date', $date);
        if ($staffId = $request->input('staff_id')) $query->where('staff_id', $staffId);
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
            'service_id' => 'required|exists:salon_services,id',
            'staff_id' => 'nullable|exists:salon_staff,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email',
            'date' => 'required|date',
            'time_slot' => 'required|string',
            'notes' => 'nullable|string',
        ]);
        $service = SalonService::findOrFail($data['service_id']);
        $data['total_price'] = $service->price;
        return $this->successResponse(SalonAppointment::create($data), 'Đã tạo lịch hẹn', 201);
    }

    public function showAppointment($id)
    {
        return $this->successResponse(SalonAppointment::with(['service', 'staff'])->findOrFail($id));
    }

    public function updateAppointment(Request $request, $id)
    {
        $apt = SalonAppointment::findOrFail($id);
        $newStatus = $request->input('status');

        // Handle status transitions with timestamps
        if ($newStatus && $newStatus !== $apt->status) {
            if ($newStatus === 'confirmed') $apt->confirmed_at = now();
            if ($newStatus === 'completed') $apt->completed_at = now();
            if ($newStatus === 'cancelled') $apt->cancelled_at = now();
        }

        $apt->update($request->only([
            'service_id', 'staff_id', 'customer_name', 'customer_phone', 'customer_email',
            'date', 'time_slot', 'status', 'notes',
        ]));
        return $this->successResponse($apt->load(['service', 'staff']), 'Đã cập nhật');
    }

    public function destroyAppointment($id)
    {
        SalonAppointment::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Calendar ──

    public function calendar(Request $request)
    {
        $start = $request->input('start', now()->startOfMonth()->format('Y-m-d'));
        $end = $request->input('end', now()->endOfMonth()->format('Y-m-d'));
        return $this->successResponse(
            SalonAppointment::with(['service', 'staff'])
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')->orderBy('time_slot')->get()
        );
    }

    // ── Stats ──

    public function stats()
    {
        $totalAppointments = SalonAppointment::count();
        $todayAppointments = SalonAppointment::whereDate('date', today())->count();
        $pending = SalonAppointment::where('status', 'pending')->count();
        $revenue = SalonAppointment::where('status', 'completed')->sum('total_price');
        $totalServices = SalonService::count();
        $totalStaff = SalonStaff::where('is_active', true)->count();
        $topServices = SalonService::withCount('appointments')->orderBy('appointments_count', 'desc')->limit(5)->get(['id', 'name', 'price']);
        $byStatus = SalonAppointment::selectRaw('status, count(*) as count')
            ->groupBy('status')->pluck('count', 'status');

        return $this->successResponse(compact(
            'totalAppointments', 'todayAppointments', 'pending', 'revenue',
            'totalServices', 'totalStaff', 'topServices', 'byStatus'
        ));
    }
}

