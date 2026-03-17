<?php
namespace App\Actions\Category;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        return $this->successResponse($this->repo->getCategories());
    }
}
