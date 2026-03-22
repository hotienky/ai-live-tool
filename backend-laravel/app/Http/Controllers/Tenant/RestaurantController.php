<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\RestaurantTable;
use App\Models\RestaurantHour;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RestaurantController extends Controller
{
    use ApiResponse;

    // ── Menu Categories ──

    public function categories()
    {
        return $this->successResponse(MenuCategory::withCount('items')->orderBy('sort_order')->get());
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        return $this->successResponse(MenuCategory::create($data), 'Đã tạo danh mục', 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $cat = MenuCategory::findOrFail($id);
        $cat->update($request->only(['name', 'description', 'image', 'is_active', 'sort_order']));
        return $this->successResponse($cat, 'Đã cập nhật');
    }

    public function destroyCategory($id)
    {
        MenuCategory::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Menu Items ──

    public function menuItems(Request $request)
    {
        $query = MenuItem::with('category');
        if ($catId = $request->input('category_id')) $query->where('category_id', $catId);
        if ($search = $request->input('search')) $query->where('name', 'ilike', "%{$search}%");
        return $this->successResponse($query->orderBy('sort_order')->paginate($request->input('per_page', 50)));
    }

    public function storeItem(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:menu_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|string',
            'is_available' => 'boolean',
            'is_popular' => 'boolean',
            'allergens' => 'nullable|array',
            'variants' => 'nullable|array',
            'preparation_time' => 'nullable|integer|min:1',
            'spice_level' => 'nullable|string|in:none,mild,medium,hot,extra_hot',
        ]);
        return $this->successResponse(MenuItem::create($data), 'Đã thêm món', 201);
    }

    public function showItem($id)
    {
        return $this->successResponse(MenuItem::with('category')->findOrFail($id));
    }

    public function updateItem(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);
        $item->update($request->only([
            'category_id', 'name', 'description', 'price', 'original_price', 'image',
            'is_available', 'is_popular', 'allergens', 'sort_order',
            'variants', 'preparation_time', 'spice_level',
        ]));
        return $this->successResponse($item, 'Đã cập nhật');
    }

    public function destroyItem($id)
    {
        MenuItem::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Reservations ──

    public function reservations(Request $request)
    {
        $query = Reservation::with('table');
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($date = $request->input('date')) $query->whereDate('date', $date);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'ilike', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('confirmation_code', 'ilike', "%{$search}%");
            });
        }
        return $this->successResponse($query->orderBy('date', 'desc')->orderBy('time')->paginate($request->input('per_page', 20)));
    }

    public function storeReservation(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email',
            'date' => 'required|date',
            'time' => 'required|string',
            'party_size' => 'integer|min:1',
            'notes' => 'nullable|string',
            'table_id' => 'nullable|exists:restaurant_tables,id',
            'table_number' => 'nullable|string|max:20',
        ]);
        $data['confirmation_code'] = strtoupper(Str::random(8));
        $data['source'] = 'admin';
        return $this->successResponse(Reservation::create($data), 'Đã tạo đặt bàn', 201);
    }

    public function showReservation($id)
    {
        return $this->successResponse(Reservation::with('table')->findOrFail($id));
    }

    public function updateReservation(Request $request, $id)
    {
        $res = Reservation::findOrFail($id);
        $res->update($request->only([
            'customer_name', 'customer_phone', 'customer_email',
            'date', 'time', 'party_size', 'status', 'notes', 'table_number', 'table_id',
        ]));
        return $this->successResponse($res, 'Đã cập nhật');
    }

    public function destroyReservation($id)
    {
        Reservation::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Tables ──

    public function tables()
    {
        return $this->successResponse(RestaurantTable::orderBy('table_number')->get());
    }

    public function storeTable(Request $request)
    {
        $data = $request->validate([
            'table_number' => 'required|string|max:20',
            'capacity' => 'required|integer|min:1',
            'location' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);
        return $this->successResponse(RestaurantTable::create($data), 'Đã tạo bàn', 201);
    }

    public function updateTable(Request $request, $id)
    {
        $table = RestaurantTable::findOrFail($id);
        $table->update($request->only(['table_number', 'capacity', 'location', 'is_active']));
        return $this->successResponse($table, 'Đã cập nhật');
    }

    public function destroyTable($id)
    {
        RestaurantTable::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Opening Hours ──

    public function hours()
    {
        return $this->successResponse(RestaurantHour::orderByRaw("CASE day_of_week
            WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6
            WHEN 'sunday' THEN 7 END")->get());
    }

    public function storeHour(Request $request)
    {
        $data = $request->validate([
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'open_time' => 'required|string',
            'close_time' => 'required|string',
            'last_reservation_time' => 'nullable|string',
            'is_closed' => 'boolean',
        ]);
        return $this->successResponse(RestaurantHour::updateOrCreate(['day_of_week' => $data['day_of_week']], $data), 'Đã lưu', 201);
    }

    public function updateHour(Request $request, $id)
    {
        $hour = RestaurantHour::findOrFail($id);
        $hour->update($request->only(['open_time', 'close_time', 'last_reservation_time', 'is_closed']));
        return $this->successResponse($hour, 'Đã cập nhật');
    }

    public function destroyHour($id)
    {
        RestaurantHour::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Stats ──

    public function stats()
    {
        $totalItems = MenuItem::count();
        $availableItems = MenuItem::where('is_available', true)->count();
        $categories = MenuCategory::count();
        $totalReservations = Reservation::count();
        $todayReservations = Reservation::whereDate('date', today())->count();
        $tables = RestaurantTable::count();
        $byStatus = Reservation::selectRaw('status, count(*) as count')
            ->groupBy('status')->pluck('count', 'status');

        return $this->successResponse(compact(
            'totalItems', 'availableItems', 'categories', 'totalReservations', 'todayReservations', 'tables', 'byStatus'
        ));
    }
}

