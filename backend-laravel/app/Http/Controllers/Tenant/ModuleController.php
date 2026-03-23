<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\ModuleRegistry;
use App\Events\ModuleInstalled;
use App\Events\ModuleUninstalled;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    // Get current tenant ID from the tenancy context
    private function tenantId(): string
    {
        $id = tenant('id');
        if ($id) return (string) $id;

        // Fallback: resolve slug from X-Tenant header to integer ID
        $slug = request()->header('X-Tenant', '');
        if ($slug) {
            $tenant = \App\Models\Tenant::where('slug', $slug)->first();
            if ($tenant) return (string) $tenant->id;
        }

        return '';
    }

    // List all available modules with install status for current tenant
    public function index()
    {
        $modules = ModuleRegistry::listForTenant($this->tenantId());
        $installed = ModuleRegistry::installedModuleIds($this->tenantId());

        return response()->json([
            'type' => 'success',
            'data' => [
                'modules' => $modules,
                'installed' => $installed,
            ],
        ]);
    }

    // Install a module
    public function install(Request $request)
    {
        $moduleId = $request->input('module_id');
        $userId = auth()->id();
        $result = ModuleRegistry::install($this->tenantId(), $moduleId, $userId);

        $code = $result['success'] ? 200 : 422;
        $data = $result['success'] ? [
            'modules' => ModuleRegistry::listForTenant($this->tenantId()),
            'installed' => ModuleRegistry::installedModuleIds($this->tenantId()),
        ] : [];

        // Fire event for plugins
        if ($result['success']) {
            ModuleInstalled::dispatch($moduleId, $this->tenantId());
        }

        return response()->json([
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
            'data' => $data,
        ], $code);
    }

    // Uninstall a module
    public function uninstall(Request $request)
    {
        $moduleId = $request->input('module_id');
        $result = ModuleRegistry::uninstall($this->tenantId(), $moduleId);

        $code = $result['success'] ? 200 : 422;
        $data = $result['success'] ? [
            'modules' => ModuleRegistry::listForTenant($this->tenantId()),
            'installed' => ModuleRegistry::installedModuleIds($this->tenantId()),
        ] : [];

        // Fire event for plugins
        if ($result['success']) {
            ModuleUninstalled::dispatch($moduleId, $this->tenantId());
        }

        return response()->json([
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
            'data' => $data,
        ], $code);
    }

    // Request a paid module
    public function request(Request $request)
    {
        $moduleId = $request->input('module_id');
        $note = $request->input('note', '');
        $userId = auth()->id();
        $result = ModuleRegistry::requestModule($this->tenantId(), $moduleId, $userId, $note);

        $data = [
            'modules' => ModuleRegistry::listForTenant($this->tenantId()),
            'installed' => ModuleRegistry::installedModuleIds($this->tenantId()),
        ];

        return response()->json([
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
            'data' => $data,
        ], $result['success'] ? 200 : 422);
    }

    // Get sidebar items (installed modules only)
    public function sidebar()
    {
        return response()->json([
            'type' => 'success',
            'data' => [
                'installed' => ModuleRegistry::installedModuleIds($this->tenantId()),
                'sidebar' => ModuleRegistry::getSidebarItems($this->tenantId()),
            ],
        ]);
    }

    // Serve from public/plugins/ directory
    public function serveBundle($moduleId, $file)
    {
        if (!in_array($file, ['bundle.js', 'style.css'])) {
            return response('Not Found', 404);
        }

        $path = public_path("plugins/{$moduleId}/{$file}");
        if (!file_exists($path)) {
            return response('Not Found', 404);
        }

        $contentType = str_ends_with($file, '.js') ? 'application/javascript' : 'text/css';
        return response(file_get_contents($path), 200)
            ->header('Content-Type', $contentType)
            ->header('Cache-Control', 'no-cache, must-revalidate');
    }
}
