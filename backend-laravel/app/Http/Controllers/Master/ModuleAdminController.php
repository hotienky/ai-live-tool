<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\TenantModuleSubscription;
use App\Services\ModuleRegistry;
use Illuminate\Http\Request;

class ModuleAdminController extends Controller
{
    // List all modules (admin view)
    public function index()
    {
        $modules = Module::orderBy('category')->orderBy('name')->get();
        return response()->json([
            'type' => 'success',
            'data' => ['modules' => $modules],
        ]);
    }

    // Create a new module
    public function store(Request $request)
    {
        $validated = $request->validate([
            'module_id' => 'required|string|unique:master.modules,module_id|max:50',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:50',
            'version' => 'nullable|string|max:20',
            'price' => 'nullable|numeric|min:0',
            'sidebar' => 'nullable|array',
            'requires' => 'nullable|array',
        ]);

        $module = Module::create($validated);
        return response()->json([
            'type' => 'success',
            'data' => ['module' => $module],
            'message' => "Đã tạo module: {$module->name}",
        ], 201);
    }

    // Update a module
    public function update(Request $request, $id)
    {
        $module = Module::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:50',
            'version' => 'nullable|string|max:20',
            'price' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'sidebar' => 'nullable|array',
            'requires' => 'nullable|array',
            'config' => 'nullable|array',
        ]);

        $module->update($validated);
        return response()->json([
            'type' => 'success',
            'data' => ['module' => $module->fresh()],
            'message' => "Đã cập nhật module: {$module->name}",
        ]);
    }

    // Delete a module
    public function destroy($id)
    {
        $module = Module::findOrFail($id);
        $name = $module->name;
        $module->delete();

        return response()->json([
            'type' => 'success',
            'message' => "Đã xoá module: {$name}",
        ]);
    }

    // Toggle active status
    public function toggle($id)
    {
        $module = Module::findOrFail($id);
        $module->update(['is_active' => !$module->is_active]);

        $status = $module->is_active ? 'bật' : 'tắt';
        return response()->json([
            'type' => 'success',
            'data' => ['module' => $module->fresh()],
            'message' => "Đã {$status} module: {$module->name}",
        ]);
    }

    // List pending module requests from tenants
    public function pendingRequests()
    {
        $requests = TenantModuleSubscription::where('status', 'pending')
            ->with('module')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'tenant_id' => $sub->tenant_id,
                    'module_id' => $sub->module_id,
                    'module_name' => $sub->module?->name,
                    'module_price' => $sub->module?->price,
                    'request_note' => $sub->request_note,
                    'requested_at' => $sub->created_at?->toISOString(),
                    'requested_by' => $sub->installed_by,
                ];
            });

        return response()->json([
            'type' => 'success',
            'data' => ['requests' => $requests],
        ]);
    }

    // Approve a pending request
    public function approve($id)
    {
        $result = ModuleRegistry::approveRequest((int) $id);
        return response()->json([
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ], $result['success'] ? 200 : 422);
    }

    // Reject a pending request
    public function reject(Request $request, $id)
    {
        $reason = $request->input('reason', '');
        $result = ModuleRegistry::rejectRequest((int) $id, $reason);
        return response()->json([
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ], $result['success'] ? 200 : 422);
    }
}
