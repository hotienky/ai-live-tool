<?php
namespace App\Repositories\Lead;
use App\Repositories\BaseRepoInterface;

interface LeadRepositoryInterface extends BaseRepoInterface
{
    public function getLeads();
    public function getPipelineStats();
}
