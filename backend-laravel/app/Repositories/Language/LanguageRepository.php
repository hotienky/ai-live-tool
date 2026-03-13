<?php
namespace App\Repositories\Language;

use App\Models\Language;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;

class LanguageRepository extends BaseEloquentRepository implements LanguageRepositoryInterface
{
    public function __construct(Language $model)
    {
        parent::__construct($model);
    }

    public function getAllSorted()
    {
        return $this->model->orderBy('sort')->get();
    }

    public function getTranslations(int $languageId)
    {
        return DB::table('language_translations')
            ->where('language_id', $languageId)
            ->pluck('value', 'key');
    }

    public function upsertTranslations(int $languageId, array $translations)
    {
        foreach ($translations as $key => $value) {
            DB::table('language_translations')->updateOrInsert(
                ['language_id' => $languageId, 'key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }
        return $this->getTranslations($languageId);
    }
}
