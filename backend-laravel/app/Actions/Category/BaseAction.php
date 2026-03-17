<?php
namespace App\Actions\Category;

use App\Repositories\Category\CategoryRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;

abstract class BaseAction
{
    use ApiResponse, LogsActivity;

    public function __construct(protected CategoryRepositoryInterface $repo) {}
}
