<?php
namespace App\Actions\MasterUser;

use App\Repositories\MasterUser\MasterUserRepositoryInterface;
use App\Pipelines\QueryPipeline;
use App\Pipelines\Filters\SearchFilter;
use App\Pipelines\Filters\SortFilter;
use App\Traits\ApiResponse;

class IndexAction
{
    use ApiResponse;

    public function __construct(
        private MasterUserRepositoryInterface $repo,
        private QueryPipeline $pipeline,
    ) {}

    public function __invoke()
    {
        $query = $this->repo->query()->with('role')->select(['id', 'name', 'email', 'role_id', 'is_active', 'created_at']);

        $query = $this->pipeline->process($query, [
            SearchFilter::class,
            SortFilter::class,
        ]);

        return $this->successResponse(
            $this->repo->paginate($query)
        );
    }
}
