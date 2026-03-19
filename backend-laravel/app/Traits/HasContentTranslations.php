<?php

namespace App\Traits;

use App\Models\ContentTranslation;
use Illuminate\Support\Facades\Log;

trait HasContentTranslations
{
    /**
     * Helper to automatically save translations grouped by locale.
     * $translations format: ['en' => ['name' => '...', 'description' => '...'], 'ja' => [...]]
     */
    protected function syncTranslations(string $table, $id, array $translations)
    {
        Log::info("SYNC CALLED for $table ($id)", ['translations' => $translations]);
        if (empty($translations)) {
            Log::info("SYNC: translations empty, skipping");
            return;
        }

        // Let errors propagate so they are visible in the API response
        ContentTranslation::upsertGrouped($table, $id, $translations);
        Log::info("SYNC: upsertGrouped completed for $table ($id)");
    }
}
