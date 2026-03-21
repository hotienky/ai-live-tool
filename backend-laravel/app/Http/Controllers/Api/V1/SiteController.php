<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/site
     * Returns site configuration, theme settings, and installed modules.
     */
    public function index(Request $request)
    {
        $configs = DB::table('system_configs')
            ->whereIn('group', ['general', 'theme', 'seo', 'social'])
            ->get()
            ->groupBy('group')
            ->map(fn ($items) => $items->pluck('value', 'key'));

        $modules = DB::table('modules')
            ->where('is_installed', true)
            ->select('module_id', 'name', 'description', 'version')
            ->get();

        $tenant = tenancy()->tenant;

        return $this->successResponse([
            'name' => $configs['general']['site_name'] ?? ($tenant->name ?? ''),
            'description' => $configs['general']['site_description'] ?? '',
            'logo' => $configs['general']['site_logo'] ?? '',
            'favicon' => $configs['general']['site_favicon'] ?? '',
            'language' => $configs['general']['default_language'] ?? 'vi',
            'timezone' => $configs['general']['timezone'] ?? 'Asia/Ho_Chi_Minh',
            'theme' => $configs['theme'] ?? (object)[],
            'seo' => $configs['seo'] ?? (object)[],
            'social' => $configs['social'] ?? (object)[],
            'modules' => $modules->pluck('module_id'),
            'content_types' => array_keys(app(\App\Services\ContentTypeRegistry::class)->all()),
        ]);
    }
}
