<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\DomainManager;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class DomainController extends Controller
{
    /**
     * List all domains for the current tenant
     */
    public function index()
    {
        $tenantId = tenant('id');
        if (!$tenantId) return response()->json(['success' => false, 'message' => 'No tenant context'], 400);

        $domains = \DB::connection('master')
            ->table('domains')
            ->where('tenant_id', $tenantId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $domains
        ]);
    }

    /**
     * Add a new domain
     */
    public function store(Request $request)
    {
        $request->validate([
            'domain' => 'required|string|max:255',
            'type' => 'sometimes|string|in:storefront,cms'
        ]);

        $tenantId = tenant('id');
        if (!$tenantId) return response()->json(['success' => false, 'message' => 'No tenant context'], 400);
        
        $tenant = Tenant::findOrFail($tenantId);

        $result = DomainManager::addDomain($tenant, $request->domain, $request->input('type', 'storefront'));
        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Verify a domain
     */
    public function verify(Request $request)
    {
        $request->validate(['domain' => 'required|string']);
        
        $result = DomainManager::verifyDomain($request->domain);
        
        // Mocking SSL provision & Nginx reload here after verification
        if ($result['success']) {
            DomainManager::provisionSSL($request->domain);
            DomainManager::reloadNginx();
        }

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Set domain as primary
     */
    public function setPrimary(Request $request)
    {
        $request->validate(['domain' => 'required|string']);

        $tenantId = tenant('id');
        if (!$tenantId) return response()->json(['success' => false, 'message' => 'No tenant context'], 400);
        
        $tenant = Tenant::findOrFail($tenantId);

        $result = DomainManager::setPrimaryDomain($tenant, $request->domain);
        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Delete a domain
     */
    public function destroy(Request $request, string $domain)
    {
        $tenantId = tenant('id');
        if (!$tenantId) return response()->json(['success' => false, 'message' => 'No tenant context'], 400);

        $record = \DB::connection('master')->table('domains')
            ->where('tenant_id', $tenantId)
            ->where('domain', $domain)
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Tên miền không tồn tại.'], 404);
        }

        if ($record->is_primary) {
            return response()->json(['success' => false, 'message' => 'Không thể xoá tên miền chính. Vui lòng đặt tên miền khác làm chính trước.'], 400);
        }

        \DB::connection('master')->table('domains')
            ->where('tenant_id', $tenantId)
            ->where('domain', $domain)
            ->delete();

        DomainManager::reloadNginx();

        return response()->json(['success' => true, 'message' => 'Đã xoá tên miền.']);
    }
}
