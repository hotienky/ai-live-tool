<?php
namespace App\Repositories\Language;

use App\Models\Language;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LanguageRepository extends BaseEloquentRepository implements LanguageRepositoryInterface
{
    public function __construct(Language $model)
    {
        parent::__construct($model);
    }

    public function getAllSorted()
    {
        try {
            return $this->model->orderBy('sort')->orderBy('id')->get();
        } catch (\Exception $e) {
            // Fallback if 'sort' column doesn't exist yet
            return $this->model->orderBy('id')->get();
        }
    }

    public function store($data = [])
    {
        // Map frontend field names to DB column names
        $mapped = [
            'code' => $data['code'] ?? '',
            'name' => $data['name'] ?? '',
            'is_default' => !empty($data['isDefault']) || !empty($data['is_default']),
            'is_active' => $data['is_active'] ?? true,
            'sort' => $data['sort'] ?? ($this->model->max('sort') + 1),
        ];

        // If setting as default, reset all others first
        if ($mapped['is_default']) {
            $this->model->where('is_default', true)->update(['is_default' => false]);
        }

        return $this->model->create($mapped);
    }

    public function update($data, $id, $attribute = 'id')
    {
        $mapped = [];

        if (isset($data['code'])) $mapped['code'] = $data['code'];
        if (isset($data['name'])) $mapped['name'] = $data['name'];
        if (isset($data['is_active'])) $mapped['is_active'] = $data['is_active'];
        if (isset($data['sort'])) $mapped['sort'] = $data['sort'];

        // Handle isDefault / is_default
        $setDefault = !empty($data['isDefault']) || !empty($data['is_default']);
        if ($setDefault) {
            $this->model->where('is_default', true)->update(['is_default' => false]);
            $mapped['is_default'] = true;
        }

        return $this->model->where($attribute, $id)->update($mapped);
    }

    public function getTranslations(int $languageId)
    {
        try {
            // Try language_id first (new schema)
            if (DB::getSchemaBuilder()->hasColumn('language_translations', 'language_id')) {
                return DB::table('language_translations')
                    ->where('language_id', $languageId)
                    ->pluck('value', 'key');
            }
            // Fallback to language_code (old schema)
            $lang = $this->model->find($languageId);
            if ($lang) {
                return DB::table('language_translations')
                    ->where('language_code', $lang->code)
                    ->pluck('value', 'key');
            }
        } catch (\Exception $e) {
            Log::warning('Language translations error: ' . $e->getMessage());
        }
        return collect();
    }

    public function upsertTranslations(int $languageId, array $translations)
    {
        $lang = $this->model->find($languageId);
        $hasLangId = DB::getSchemaBuilder()->hasColumn('language_translations', 'language_id');

        foreach ($translations as $key => $value) {
            $where = $hasLangId
                ? ['language_id' => $languageId, 'key' => $key]
                : ['language_code' => $lang->code ?? '', 'key' => $key];

            $updateData = ['value' => $value, 'updated_at' => now()];
            if ($hasLangId) $updateData['language_id'] = $languageId;
            if ($lang) $updateData['language_code'] = $lang->code;

            DB::table('language_translations')->updateOrInsert($where, $updateData);
        }
        return $this->getTranslations($languageId);
    }
}
