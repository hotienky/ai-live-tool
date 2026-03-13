<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemConfigController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $group = request()->input('group');
        $query = DB::table('system_configs');
        if ($group) $query->where('group', $group);
        return $this->successResponse($query->get());
    }

    public function store(Request $request)
    {
        try {
            $items = $request->input('items', []);
            foreach ($items as $item) {
                DB::table('system_configs')->updateOrInsert(
                    ['key' => $item['key'], 'group' => $item['group'] ?? 'general'],
                    ['value' => $item['value'], 'updated_at' => now()]
                );
            }
            return $this->successResponse(null, 'Config saved');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
