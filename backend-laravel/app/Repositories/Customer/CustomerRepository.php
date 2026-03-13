<?php
namespace App\Repositories\Customer;
use App\Models\Customer;
use App\Repositories\BaseEloquentRepository;

class CustomerRepository extends BaseEloquentRepository implements CustomerRepositoryInterface
{
    public function __construct(Customer $model) { parent::__construct($model); }
}
