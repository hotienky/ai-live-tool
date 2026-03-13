<?php
namespace App\Repositories\Webhook;

use App\Models\Webhook;
use App\Repositories\BaseEloquentRepository;

class WebhookRepository extends BaseEloquentRepository implements WebhookRepositoryInterface
{
    public function __construct(Webhook $model)
    {
        parent::__construct($model);
    }
}
