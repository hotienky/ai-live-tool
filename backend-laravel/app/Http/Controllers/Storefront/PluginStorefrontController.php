<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\BookingService;
use App\Models\BookingAppointment;
use App\Models\EventTicket;
use App\Models\EventRegistration;
use App\Models\JobApplication;
use App\Models\PropertyInquiry;
use App\Models\LuckyWheel;
use App\Models\WheelPrize;
use App\Models\WheelSpin;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\SalonService;
use App\Models\SalonStaff;
use App\Models\SalonAppointment;
use App\Models\MembershipTier;
use App\Models\Content;
use App\Models\ContentMeta;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PluginStorefrontController extends Controller
{
    use ApiResponse;

    // ═══════════════════ BOOKING ═══════════════════

    public function bookingServices()
    {
        return $this->successResponse(
            BookingService::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function bookingServiceDetail($id)
    {
        return $this->successResponse(BookingService::where('is_active', true)->findOrFail($id));
    }

    public function bookingAvailableSlots(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:booking_services,id',
            'date' => 'required|date|after_or_equal:today',
        ]);

        $service = BookingService::findOrFail($request->service_id);
        $date = $request->date;
        $dayOfWeek = strtolower(date('l', strtotime($date))); // monday, tuesday, ...

        // Get working hours for this day
        $hours = $service->working_hours[$dayOfWeek] ?? '09:00-18:00';
        if ($hours === 'closed') {
            return $this->successResponse([]);
        }

        [$openTime, $closeTime] = explode('-', $hours);
        $duration = $service->duration_minutes ?? 60;
        $buffer = $service->buffer_minutes ?? 0;
        $maxPerSlot = $service->max_bookings_per_slot ?? 1;

        // Get existing appointments for this date+service
        $existing = BookingAppointment::where('service_id', $service->id)
            ->whereDate('date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->pluck('time_slot')
            ->countBy()
            ->toArray();

        // Build available slots
        $slots = [];
        $current = strtotime($openTime);
        $end = strtotime($closeTime);

        while ($current + ($duration * 60) <= $end) {
            $slotTime = date('H:i', $current);
            $bookedCount = $existing[$slotTime] ?? 0;

            if ($bookedCount < $maxPerSlot) {
                $slots[] = [
                    'time' => $slotTime,
                    'available' => $maxPerSlot - $bookedCount,
                ];
            }

            $current += ($duration + $buffer) * 60;
        }

        return $this->successResponse($slots);
    }

    public function bookingStore(Request $request)
    {
        $data = $request->validate([
            'service_id' => 'required|exists:booking_services,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email',
            'date' => 'required|date|after_or_equal:today',
            'time_slot' => 'required|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validate slot is available
        $service = BookingService::findOrFail($data['service_id']);
        $maxPerSlot = $service->max_bookings_per_slot ?? 1;
        $bookedCount = BookingAppointment::where('service_id', $data['service_id'])
            ->whereDate('date', $data['date'])
            ->where('time_slot', $data['time_slot'])
            ->whereNotIn('status', ['cancelled'])
            ->count();

        if ($bookedCount >= $maxPerSlot) {
            return $this->errorResponse('Slot đã đầy, vui lòng chọn thời gian khác', 422);
        }

        $data['total_price'] = $service->price;
        $appointment = BookingAppointment::create($data);

        return $this->successResponse($appointment, 'Đặt lịch thành công! Chúng tôi sẽ xác nhận sớm.', 201);
    }

    // ═══════════════════ EVENTS ═══════════════════

    public function eventRegister(Request $request, $eventId)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'ticket_id' => 'nullable|exists:event_tickets,id',
            'extra_info' => 'nullable|array',
        ]);

        // Check ticket availability
        if (!empty($data['ticket_id'])) {
            $ticket = EventTicket::findOrFail($data['ticket_id']);
            if (!$ticket->is_active) {
                return $this->errorResponse('Loại vé này không còn mở', 422);
            }
            if ($ticket->quantity && $ticket->sold_count >= $ticket->quantity) {
                return $this->errorResponse('Vé đã hết', 422);
            }
            $ticket->increment('sold_count');
        }

        $data['event_id'] = $eventId;
        $data['registration_code'] = strtoupper(Str::random(8));

        $reg = EventRegistration::create($data);
        return $this->successResponse($reg, 'Đăng ký thành công!', 201);
    }

    public function eventTickets($eventId)
    {
        return $this->successResponse(
            EventTicket::where('event_id', $eventId)->where('is_active', true)->get()
        );
    }

    // ═══════════════════ JOB BOARD ═══════════════════

    public function jobApply(Request $request, $jobId)
    {
        $data = $request->validate([
            'applicant_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'resume_url' => 'nullable|string|max:500',
            'cover_letter' => 'nullable|string|max:5000',
            'extra_info' => 'nullable|array',
        ]);
        $data['job_id'] = $jobId;
        return $this->successResponse(JobApplication::create($data), 'Ứng tuyển thành công!', 201);
    }

    // ═══════════════════ REAL ESTATE ═══════════════════

    public function listingInquiry(Request $request, $listingId)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'message' => 'nullable|string|max:2000',
        ]);
        $data['listing_id'] = $listingId;
        return $this->successResponse(PropertyInquiry::create($data), 'Đã gửi liên hệ!', 201);
    }

    // ═══════════════════ LUCKY DRAW ═══════════════════

    public function luckyDrawShow($id)
    {
        $wheel = LuckyWheel::with('prizes:id,wheel_id,label,color,sort_order')
            ->where('is_active', true)
            ->findOrFail($id);

        // Check campaign dates
        if ($wheel->start_date && now()->lt($wheel->start_date)) {
            return $this->errorResponse('Chương trình chưa bắt đầu', 422);
        }
        if ($wheel->end_date && now()->gt($wheel->end_date)) {
            return $this->errorResponse('Chương trình đã kết thúc', 422);
        }

        // Hide probabilities from public
        $wheel->prizes->each(fn ($p) => $p->makeHidden(['probability', 'stock', 'redeemed_count']));

        return $this->successResponse($wheel);
    }

    public function luckyDrawSpin(Request $request, $id)
    {
        $wheel = LuckyWheel::with('prizes')->where('is_active', true)->findOrFail($id);

        // Check campaign dates
        if ($wheel->start_date && now()->lt($wheel->start_date)) {
            return $this->errorResponse('Chương trình chưa bắt đầu', 422);
        }
        if ($wheel->end_date && now()->gt($wheel->end_date)) {
            return $this->errorResponse('Chương trình đã kết thúc', 422);
        }

        // Check spin limits per IP (anti-cheat)
        $ip = $request->ip();
        if ($wheel->max_spins_per_user) {
            $spinCount = WheelSpin::where('wheel_id', $id)->where('ip_address', $ip)->count();
            if ($spinCount >= $wheel->max_spins_per_user) {
                return $this->errorResponse('Bạn đã hết lượt quay', 429);
            }
        }

        // Server-side probability calculation
        $prizes = $wheel->prizes->filter(fn ($p) => !$p->stock || $p->redeemed_count < $p->stock);
        $totalProb = $prizes->sum('probability');
        if ($totalProb <= 0) {
            return $this->errorResponse('Giải thưởng đã hết', 422);
        }

        $rand = mt_rand(0, (int)($totalProb * 100)) / 100;
        $cumulative = 0;
        $wonPrize = null;

        foreach ($prizes as $prize) {
            $cumulative += $prize->probability;
            if ($rand <= $cumulative) {
                $wonPrize = $prize;
                break;
            }
        }

        // Record spin
        $spin = WheelSpin::create([
            'wheel_id' => $id,
            'prize_id' => $wonPrize?->id,
            'customer_name' => $request->input('name'),
            'customer_phone' => $request->input('phone'),
            'customer_email' => $request->input('email'),
            'ip_address' => $ip,
            'won_at' => now(),
        ]);

        if ($wonPrize) {
            $wonPrize->increment('redeemed_count');
        }
        $wheel->increment('spin_count');

        return $this->successResponse([
            'spin_id' => $spin->id,
            'prize' => $wonPrize ? [
                'id' => $wonPrize->id,
                'label' => $wonPrize->label,
                'type' => $wonPrize->prize_type,
                'value' => $wonPrize->prize_value,
            ] : null,
        ], $wonPrize ? "Chúc mừng! Bạn đã trúng: {$wonPrize->label}" : 'Chúc bạn may mắn lần sau!');
    }

    // ═══════════════════ LMS ═══════════════════

    public function lmsCourses(Request $request)
    {
        $query = Course::where('is_published', true)->withCount('lessons');
        if ($search = $request->input('search')) $query->where('title', 'ilike', "%{$search}%");
        return $this->successResponse($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 12)));
    }

    public function lmsCourseDetail($slug)
    {
        $course = Course::where('slug', $slug)->where('is_published', true)
            ->with(['lessons' => function ($q) { $q->select('id', 'course_id', 'title', 'sort_order', 'duration_minutes', 'is_free')->orderBy('sort_order'); }])
            ->withCount(['lessons', 'enrollments'])
            ->firstOrFail();
        return $this->successResponse($course);
    }

    // ═══════════════════ RESTAURANT ═══════════════════

    public function restaurantMenu()
    {
        $categories = MenuCategory::where('is_active', true)
            ->with(['items' => function ($q) { $q->where('is_available', true)->orderBy('sort_order'); }])
            ->orderBy('sort_order')
            ->get();
        return $this->successResponse($categories);
    }

    public function restaurantMenuItemDetail($id)
    {
        return $this->successResponse(MenuItem::with('category')->where('is_available', true)->findOrFail($id));
    }

    public function restaurantAvailableTimes(Request $request)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'party_size' => 'integer|min:1',
        ]);

        $date = $request->date;
        $dayOfWeek = strtolower(date('l', strtotime($date)));

        $hours = \App\Models\RestaurantHour::where('day_of_week', $dayOfWeek)->first();
        if (!$hours || $hours->is_closed) {
            return $this->successResponse([], 'Nhà hàng đóng cửa ngày này');
        }

        $existingReservations = Reservation::whereDate('date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->pluck('time')
            ->countBy()
            ->toArray();

        $slots = [];
        $current = strtotime($hours->open_time);
        $lastSlot = strtotime($hours->last_reservation_time ?? $hours->close_time);

        while ($current <= $lastSlot) {
            $time = date('H:i', $current);
            $slots[] = [
                'time' => $time,
                'reservations' => $existingReservations[$time] ?? 0,
            ];
            $current += 30 * 60; // 30-minute intervals
        }

        return $this->successResponse($slots);
    }

    public function restaurantReserve(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|string',
            'party_size' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $data['confirmation_code'] = strtoupper(Str::random(8));
        $data['source'] = 'website';
        $reservation = Reservation::create($data);

        return $this->successResponse($reservation, 'Đặt bàn thành công! Mã xác nhận: ' . $data['confirmation_code'], 201);
    }

    // ═══════════════════ SALON ═══════════════════

    public function salonServices()
    {
        return $this->successResponse(
            SalonService::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function salonStaffList()
    {
        return $this->successResponse(
            SalonStaff::where('is_active', true)->orderBy('name')->get(['id', 'name', 'avatar', 'specialties'])
        );
    }

    public function salonAvailableSlots(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:salon_services,id',
            'date' => 'required|date|after_or_equal:today',
            'staff_id' => 'nullable|exists:salon_staff,id',
        ]);

        $service = SalonService::findOrFail($request->service_id);
        $date = $request->date;
        $staffId = $request->staff_id;
        $dayOfWeek = strtolower(date('l', strtotime($date)));

        // Check staff day off
        if ($staffId) {
            $dayOff = \App\Models\SalonStaff::find($staffId);
            if ($dayOff) {
                $isDayOff = DB::table('salon_staff_days_off')
                    ->where('staff_id', $staffId)->whereDate('date', $date)->exists();
                if ($isDayOff) {
                    return $this->successResponse([], 'Nhân viên nghỉ ngày này');
                }

                $workingHours = $dayOff->working_hours[$dayOfWeek] ?? null;
                if (!$workingHours || $workingHours === 'off') {
                    return $this->successResponse([], 'Nhân viên không làm ngày này');
                }
            }
        }

        // Get existing appointments
        $query = SalonAppointment::where('service_id', $request->service_id)
            ->whereDate('date', $date)
            ->whereNotIn('status', ['cancelled']);
        if ($staffId) $query->where('staff_id', $staffId);
        $booked = $query->pluck('time_slot')->toArray();

        // Build slots (9:00-18:00, 30 min intervals)
        $duration = $service->duration_minutes ?? 30;
        $slots = [];
        $current = strtotime('09:00');
        $end = strtotime('18:00');

        while ($current + ($duration * 60) <= $end) {
            $time = date('H:i', $current);
            if (!in_array($time, $booked)) {
                $slots[] = $time;
            }
            $current += 30 * 60;
        }

        return $this->successResponse($slots);
    }

    public function salonBookAppointment(Request $request)
    {
        $data = $request->validate([
            'service_id' => 'required|exists:salon_services,id',
            'staff_id' => 'nullable|exists:salon_staff,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email',
            'date' => 'required|date|after_or_equal:today',
            'time_slot' => 'required|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if slot is taken
        $exists = SalonAppointment::where('service_id', $data['service_id'])
            ->whereDate('date', $data['date'])
            ->where('time_slot', $data['time_slot'])
            ->whereNotIn('status', ['cancelled']);
        if (!empty($data['staff_id'])) $exists->where('staff_id', $data['staff_id']);

        if ($exists->exists()) {
            return $this->errorResponse('Slot đã có người đặt, vui lòng chọn thời gian khác', 422);
        }

        $service = SalonService::findOrFail($data['service_id']);
        $data['total_price'] = $service->price;
        $appointment = SalonAppointment::create($data);

        return $this->successResponse($appointment, 'Đặt lịch thành công!', 201);
    }

    // ═══════════════════ MEMBERSHIP ═══════════════════

    public function membershipTiers()
    {
        return $this->successResponse(
            MembershipTier::where('is_active', true)->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'description', 'min_points', 'discount_percent', 'benefits', 'color', 'icon'])
        );
    }
}
