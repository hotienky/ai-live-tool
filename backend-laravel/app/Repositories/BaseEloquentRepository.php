<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;

abstract class BaseEloquentRepository implements BaseRepoInterface
{
    protected Model $model;

    public function __construct($model)
    {
        $this->model = $model;
    }

    public function all(array $columns = ['*'])
    {
        return $this->model->get($columns);
    }

    public function paginate($query, $perPage = 15, $columns = ['*'])
    {
        $requestedPerPage = request()->input('per_page', $perPage);
        $finalPerPage = min($requestedPerPage, config('pagination.max_per_page', 100));

        $result = $query->paginate($finalPerPage, $columns);

        return [
            'items' => $result->items(),
            'pagination' => [
                'total' => $result->total(),
                'per_page' => $result->perPage(),
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
                'has_more_pages' => $result->hasMorePages(),
            ],
        ];
    }

    public function store($data = [])
    {
        return $this->model->create($data);
    }

    public function insert($data = [])
    {
        return $this->model->insert($data);
    }

    public function update($data, $id, $attribute = 'id')
    {
        return $this->model->where($attribute, $id)->update($data);
    }

    public function delete($id)
    {
        return $this->model->destroy($id) ? true : false;
    }

    public function find($id, $columns = ['*'])
    {
        return $this->model->find($id, $columns);
    }

    public function findOne($id)
    {
        return $this->model->find($id);
    }

    public function findBy($field, $value, $columns = ['*'])
    {
        return $this->model->where($field, $value)->first($columns);
    }

    public function findOrFail($id, $columns = ['*'])
    {
        return $this->model->findOrFail($id, columns: $columns);
    }

    public function manyBy($field, $value, $columns = ['*'])
    {
        return $this->model->where($field, $value)->get($columns);
    }

    public function query()
    {
        return $this->model->query();
    }
}
