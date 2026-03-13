<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

interface BaseRepoInterface
{
    public function all(array $columns = ['*']);

    public function paginate(EloquentBuilder|QueryBuilder $query, int $perPage = 15, array $columns = ['*']);

    public function store(array $data);

    public function insert(array $data);

    public function update(array $data, int|string $id, string $attribute = 'id');

    public function delete(int|string $id);

    public function find(int|string $id, array $columns = ['*']);

    public function findOne(int|string $id);

    public function findBy(string $field, mixed $value, array $columns = ['*']);

    public function findOrFail(int|string $id, array $columns = ['*']);

    public function manyBy(string $field, mixed $value, array $columns = ['*']);

    public function query();
}
