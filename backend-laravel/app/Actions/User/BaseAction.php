<?php
namespace App\Actions\User;

use App\Repositories\User\UserRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;

abstract class BaseAction
{
    use ApiResponse, LogsActivity;

    public function __construct(protected UserRepositoryInterface $repo) {}
}
