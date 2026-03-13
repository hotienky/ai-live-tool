<?php
namespace App\Repositories\FlashSale;

use App\Repositories\BaseRepoInterface;

interface FlashSaleRepositoryInterface extends BaseRepoInterface
{
    public function getActive();
}
