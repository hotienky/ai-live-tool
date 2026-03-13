<?php
namespace App\Repositories\CustomField;

use App\Models\CustomField;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;

class CustomFieldRepository extends BaseEloquentRepository implements CustomFieldRepositoryInterface
{
    public function __construct(CustomField $model)
    {
        parent::__construct($model);
    }

    public function getAllSorted()
    {
        return $this->model->orderBy('sort')->get();
    }

    public function getValues(string $entityType, int $entityId)
    {
        return DB::table('custom_field_values')
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->get();
    }

    public function upsertValues(string $entityType, int $entityId, array $values)
    {
        foreach ($values as $fieldId => $value) {
            DB::table('custom_field_values')->updateOrInsert(
                ['entity_type' => $entityType, 'entity_id' => $entityId, 'custom_field_id' => $fieldId],
                ['value' => is_array($value) ? json_encode($value) : $value, 'updated_at' => now()]
            );
        }
        return $this->getValues($entityType, $entityId);
    }
}
