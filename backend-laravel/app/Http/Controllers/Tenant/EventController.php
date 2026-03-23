<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\EventTicket;
use App\Models\EventRegistration;
use App\Models\Content;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    use ApiResponse;

    // ── Tickets ──

    public function tickets($eventId)
    {
        return $this->successResponse(EventTicket::where('event_id', $eventId)->get());
    }

    public function storeTicket(Request $request, $eventId)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $data['event_id'] = $eventId;
        return $this->successResponse(EventTicket::create($data), 'Đã tạo loại vé', 201);
    }

    public function updateTicket(Request $request, $eventId, $id)
    {
        $ticket = EventTicket::where('event_id', $eventId)->findOrFail($id);
        $ticket->update($request->only(['name', 'price', 'quantity', 'description', 'is_active']));
        return $this->successResponse($ticket, 'Đã cập nhật');
    }

    public function destroyTicket($eventId, $id)
    {
        EventTicket::where('event_id', $eventId)->findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Registrations ──

    public function registrations(Request $request, $eventId)
    {
        $query = EventRegistration::with('ticket')->where('event_id', $eventId);
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%");
            });
        }
        return $this->successResponse($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    public function checkIn($eventId, $id)
    {
        $reg = EventRegistration::where('event_id', $eventId)->findOrFail($id);
        $reg->update(['status' => 'checked_in', 'checked_in_at' => now()]);
        return $this->successResponse($reg, 'Đã điểm danh');
    }

    public function registrationStats($eventId)
    {
        $total = EventRegistration::where('event_id', $eventId)->count();
        $checkedIn = EventRegistration::where('event_id', $eventId)->where('status', 'checked_in')->count();
        $cancelled = EventRegistration::where('event_id', $eventId)->where('status', 'cancelled')->count();
        $tickets = EventTicket::where('event_id', $eventId)->get(['id', 'name', 'price', 'quantity', 'sold_count']);

        return $this->successResponse(compact('total', 'checkedIn', 'cancelled', 'tickets'));
    }

    public function destroyRegistration($eventId, $id)
    {
        $reg = EventRegistration::where('event_id', $eventId)->findOrFail($id);
        if ($reg->ticket_id) {
            EventTicket::where('id', $reg->ticket_id)->decrement('sold_count');
        }
        $reg->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    public function globalStats()
    {
        $total      = Content::where('type', 'event')->count();
        $upcoming   = Content::where('type', 'event')->where('status', 'published')
                        ->whereDate('meta->start_date', '>=', now()->toDateString())->count();
        $registrations = EventRegistration::count();
        $checkedIn  = EventRegistration::where('status', 'checked_in')->count();

        return $this->successResponse(compact('total', 'upcoming', 'registrations', 'checkedIn'));
    }
}
