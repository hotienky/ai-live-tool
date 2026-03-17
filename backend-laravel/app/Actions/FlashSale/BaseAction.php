<?php
namespace App\Actions\FlashSale;

use App\Repositories\FlashSale\FlashSaleRepositoryInterface;
use App\Traits\ApiResponse;

abstract class BaseAction
{
    use ApiResponse;

    public function __construct(protected FlashSaleRepositoryInterface $repo) {}
}
