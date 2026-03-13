<?php
namespace App\Repositories\Keyword;
use App\Models\Keyword;
use App\Repositories\BaseEloquentRepository;

class KeywordRepository extends BaseEloquentRepository implements KeywordRepositoryInterface
{
    public function __construct(Keyword $model) { parent::__construct($model); }
}
