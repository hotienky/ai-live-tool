<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\CustomField\CustomFieldRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CustomFieldsController extends Controller
{
    use ApiResponse, \App\Traits\HasContentTranslations;

    public function __construct(private CustomFieldRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->getAllSorted());
    }

    public function store(Request $request)
    {
        $data = $request->all();
        if (isset($data['options']) && !is_string($data['options'])) {
            $data['options'] = json_encode($data['options']);
        }
        $field = $this->repo->store($data);

        if ($request->has('translations')) {
            $this->syncTranslations('custom_fields', $field->id, $request->input('translations'));
        }

        return $this->successResponse($field, 'Custom field created', 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->all();
        if (isset($data['options']) && !is_string($data['options'])) {
            $data['options'] = json_encode($data['options']);
        }
        $this->repo->update($data, $id);

        if ($request->has('translations')) {
            $this->syncTranslations('custom_fields', $id, $request->input('translations'));
        }

        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Custom field deleted');
    }

    public function getValues($entityType, $entityId)
    {
        return $this->successResponse($this->repo->getValues($entityType, $entityId));
    }

    public function updateValues(Request $request, $entityType, $entityId)
    {
        $values = $this->repo->upsertValues($entityType, $entityId, $request->input('values', []));
        return $this->successResponse($values);
    }
}
