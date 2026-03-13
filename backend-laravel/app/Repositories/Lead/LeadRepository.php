<?php
namespace App\Repositories\Lead;

use App\Models\Lead;
use App\Repositories\BaseEloquentRepository;
use App\Pipelines\LeadFilterPipeline;

class LeadRepository extends BaseEloquentRepository implements LeadRepositoryInterface
{
    public function __construct(Lead $model) { parent::__construct($model); }

    public function getLeads()
    {
        $query = $this->model->query();
        $query = LeadFilterPipeline::run($query, request()->all());
        $query->orderByDesc('created_at');
        return $query->get();
    }

    public function getPipelineStats()
    {
        return $this->model->selectRaw('status, count(*) as count, coalesce(sum(value), 0) as total_value')
            ->groupBy('status')
            ->get();
    }
}
