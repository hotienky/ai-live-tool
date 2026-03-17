<?php
namespace App\Actions\Banner;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        return $this->successResponse($this->repo->all());
    }
}
