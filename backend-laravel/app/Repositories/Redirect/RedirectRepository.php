<?php
namespace App\Repositories\Redirect;

use App\Models\SeoRedirect;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\Schema;

class RedirectRepository extends BaseEloquentRepository implements RedirectRepositoryInterface
{
    public function __construct(SeoRedirect $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'])
    {
        if (!Schema::hasTable('seo_redirects')) return collect();
        return $this->model->orderByDesc('created_at')->get($columns);
    }

    public function store($data = [])
    {
        $this->ensureTable();
        return $this->model->create(array_merge($data, [
            'status_code' => $data['status_code'] ?? 301,
            'is_active' => $data['is_active'] ?? true,
        ]));
    }

    public function update($data, $id, $attribute = 'id')
    {
        $this->ensureTable();
        return parent::update(array_merge($data, ['updated_at' => now()]), $id, $attribute);
    }

    private function ensureTable(): void
    {
        if (!Schema::hasTable('seo_redirects')) {
            Schema::create('seo_redirects', function ($t) {
                $t->id();
                $t->string('source_url', 500);
                $t->string('target_url', 500);
                $t->integer('status_code')->default(301);
                $t->boolean('is_active')->default(true);
                $t->timestamps();
            });
        }
    }
}
