<?php
namespace App\Actions\Brand;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        return $this->successResponse($this->repo->all());
    }
}
