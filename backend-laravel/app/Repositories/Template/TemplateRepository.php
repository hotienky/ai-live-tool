<?php
namespace App\Repositories\Template;

use App\Models\AutoReplyTemplate;
use App\Repositories\BaseEloquentRepository;

class TemplateRepository extends BaseEloquentRepository implements TemplateRepositoryInterface
{
    public function __construct(AutoReplyTemplate $model)
    {
        parent::__construct($model);
    }
}
