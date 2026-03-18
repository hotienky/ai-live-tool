<?php

namespace App\Repositories\Tax;

interface TaxRateRepositoryInterface
{
    public function all();
    public function getActive();
    public function find(int $id);
    public function store(array $data);
    public function update(array $data, int $id);
    public function delete(int $id);
    public function getApplicableRates(?int $categoryId = null, ?int $productId = null, ?int $provinceId = null): array;
}
