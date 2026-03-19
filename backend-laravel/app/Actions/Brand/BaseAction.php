<?php
namespace App\Actions\Brand;

use App\Repositories\Brand\BrandRepositoryInterface;
use App\Traits\ApiResponse;

abstract class BaseAction
{
    use ApiResponse, \App\Traits\HasContentTranslations;

    public function __construct(protected BrandRepositoryInterface $repo) {}
}
