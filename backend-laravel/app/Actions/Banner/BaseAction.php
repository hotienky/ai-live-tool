<?php
namespace App\Actions\Banner;

use App\Repositories\Banner\BannerRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;

abstract class BaseAction
{
    use ApiResponse, LogsActivity, \App\Traits\HasContentTranslations;

    public function __construct(protected BannerRepositoryInterface $repo) {}
}
