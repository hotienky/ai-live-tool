<?php
namespace App\Repositories\NavLink;
use App\Models\NavLink;
use App\Repositories\BaseEloquentRepository;

class NavLinkRepository extends BaseEloquentRepository implements NavLinkRepositoryInterface
{
    public function __construct(NavLink $model) { parent::__construct($model); }

    public function reorder(array $items)
    {
        foreach ($items as $item) {
            $this->model->where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }
    }
}
