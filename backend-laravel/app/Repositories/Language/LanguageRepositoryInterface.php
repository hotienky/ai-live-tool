<?php
namespace App\Repositories\Language;

use App\Repositories\BaseRepoInterface;

interface LanguageRepositoryInterface extends BaseRepoInterface
{
    public function getAllSorted();
    public function getTranslations(int $languageId);
    public function upsertTranslations(int $languageId, array $translations);
}
