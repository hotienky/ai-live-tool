<?php
namespace App\Repositories\Tenant;

use App\Models\Tenant;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TenantRepository extends BaseEloquentRepository implements TenantRepositoryInterface
{
    public function __construct(Tenant $model)
    {
        parent::__construct($model);
    }

    /**
     * Create tenant via direct DB insert, then retrieve model
     * and fire TenantCreated event to trigger pipeline (DB creation, migration, seeding).
     */
    public function store($data = [])
    {
        $data['id'] = $data['id'] ?? (string)\Illuminate\Support\Str::uuid();
        $data['created_at'] = $data['created_at'] ?? now();
        $data['updated_at'] = $data['updated_at'] ?? now();

        DB::connection('master')->table('tenants')->insert($data);

        // Retrieve as Tenant model so stancl pipeline can work
        $tenant = Tenant::find($data['id']);

        // Fire TenantCreated event to trigger DB creation + migration + seeding
        event(new \Stancl\Tenancy\Events\TenantCreated($tenant));

        return $tenant;
    }

    /**
     * Direct DB update to avoid stancl data column issue.
     */
    public function update($data, $id, $attribute = 'id')
    {
        $data['updated_at'] = now();
        DB::connection('master')->table('tenants')
            ->where($attribute, $id)
            ->update($data);
        $tenant = $this->findOne($id);
        Cache::forget("tenant_status:{$tenant->slug}");
        return $tenant;
    }

    public function suspend(int $id)
    {
        DB::connection('master')->table('tenants')
            ->where('id', $id)
            ->update(['status' => 'suspended', 'updated_at' => now()]);
        $tenant = $this->findOne($id);
        Cache::forget("tenant_status:{$tenant->slug}");
        return $tenant;
    }

    public function activate(int $id)
    {
        DB::connection('master')->table('tenants')
            ->where('id', $id)
            ->update(['status' => 'active', 'updated_at' => now()]);
        $tenant = $this->findOne($id);
        Cache::forget("tenant_status:{$tenant->slug}");
        return $tenant;
    }
}
