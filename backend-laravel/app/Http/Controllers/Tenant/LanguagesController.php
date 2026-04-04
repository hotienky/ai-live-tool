<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Models\ContentTranslation;
use App\Models\Language;
use App\Models\SupportedLanguage;
use App\Repositories\Language\LanguageRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LanguagesController extends Controller
{
    use ApiResponse;

    public function __construct(private LanguageRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->getAllSorted());
    }

    /**
     * Return supported languages that are not yet installed.
     */
    public function supported()
    {
        try {
            $available = SupportedLanguage::getAvailableForTenant();
            return $this->successResponse($available);
        } catch (\Exception $e) {
            // Fallback: return empty if table doesn't exist yet
            return $this->successResponse([]);
        }
    }

    /**
     * Get all supported languages (for reference/display).
     */
    public function allSupported()
    {
        try {
            $all = SupportedLanguage::where('is_active', true)->orderBy('sort')->get();
            return $this->successResponse($all);
        } catch (\Exception $e) {
            return $this->successResponse([]);
        }
    }

    public function store(Request $request)
    {
        $language = $this->repo->store($request->all());

        // Auto-seed translations if DB is empty for this language
        $this->seedTranslationsForLanguage($language);

        return $this->successResponse($language, 'Language created', 201);
    }

    /**
     * Auto-seed translations for a newly created language.
     * Reads en.json + vi.json as seed data, auto-translates to target language,
     * and inserts into DB. Only runs if no translations exist for this language.
     */
    private function seedTranslationsForLanguage($language)
    {
        $hasLangId = DB::getSchemaBuilder()->hasColumn('language_translations', 'language_id');
        
        // Check if translations already exist
        $existingCount = DB::table('language_translations')
            ->when($hasLangId, fn($q) => $q->where('language_id', $language->id))
            ->when(!$hasLangId, fn($q) => $q->where('language_code', $language->code))
            ->count();

        if ($existingCount > 0) {
            return; // Already has translations, don't migrate
        }

        // Load seed data from JSON files
        $storefrontDir = base_path('../storefront/src/locales');
        $adminDir = base_path('../frontend/src/locales');
        $seedData = [];

        // Try to load the language's own JSON file first (vi, en have their own)
        foreach ([$storefrontDir, $adminDir] as $dir) {
            $file = $dir . '/' . $language->code . '.json';
            if (file_exists($file)) {
                $parsed = json_decode(file_get_contents($file), true);
                if (is_array($parsed)) $seedData = array_merge($seedData, $parsed);
            }
        }

        // If no locale file for this language, auto-translate from English seed
        if (empty($seedData) && $language->code !== 'en') {
            $enBase = [];
            foreach ([$storefrontDir, $adminDir] as $dir) {
                $enFile = $dir . '/en.json';
                if (file_exists($enFile)) {
                    $parsed = json_decode(file_get_contents($enFile), true);
                    if (is_array($parsed)) $enBase = array_merge($enBase, $parsed);
                }
            }
            if (!empty($enBase)) {
                $seedData = $this->autoTranslateBatch($enBase, 'en', $language->code);
            }
        }

        if (empty($seedData)) return;

        // Batch insert translations
        $batch = [];
        $now = now();
        foreach ($seedData as $key => $value) {
            $row = [
                'key'           => $key,
                'value'         => $value,
                'language_code' => $language->code,
                'updated_at'    => $now,
                'created_at'    => $now,
            ];
            if ($hasLangId) $row['language_id'] = $language->id;
            $batch[] = $row;

            // Insert in chunks of 200
            if (count($batch) >= 200) {
                DB::table('language_translations')->insert($batch);
                $batch = [];
            }
        }
        if (!empty($batch)) {
            DB::table('language_translations')->insert($batch);
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update($request->all(), $id);
        return $this->successResponse($this->repo->findOne($id));
    }

    public function destroy($id)
    {
        $lang = Language::find($id);
        if (!$lang) {
            return $this->errorResponse('Language not found', 404);
        }
        if ($lang->is_default) {
            return $this->errorResponse('Không thể xóa ngôn ngữ mặc định (ngôn ngữ gốc)', 403);
        }
        $this->repo->delete($id);
        return $this->successResponse(null, 'Language deleted');
    }

    public function getTranslations($id)
    {
        return $this->successResponse($this->repo->getTranslations($id));
    }

    /**
     * Get translations by language code (for useI18n composable).
     * Both admin and storefront frontends call this.
     */
    public function translationsByCode($langCode)
    {
        $lang = Language::where('code', $langCode)->first();
        if (!$lang) {
            return $this->successResponse([]);
        }
        return $this->successResponse($this->repo->getTranslations($lang->id));
    }

    public function updateTranslations(Request $request, $id)
    {
        $translations = $this->repo->upsertTranslations($id, $request->input('translations', []));
        return $this->successResponse($translations);
    }

    /**
     * Sync default translations from local JSON locale files into DB.
     * Reads from both storefront/src/locales/ and frontend/src/locales/.
     * For languages without a JSON file, auto-translates from English.
     * Only inserts MISSING keys — never overwrites existing admin edits.
     */
    public function syncDefaults()
    {
        $storefrontDir = base_path('../storefront/src/locales');
        $adminDir = base_path('../frontend/src/locales');
        $languages = Language::all();
        $hasLangId = DB::getSchemaBuilder()->hasColumn('language_translations', 'language_id');
        $synced = [];

        // Load English base as fallback for auto-translation
        $enBase = [];
        foreach ([$storefrontDir, $adminDir] as $dir) {
            $enFile = $dir . '/en.json';
            if (file_exists($enFile)) {
                $parsed = json_decode(file_get_contents($enFile), true);
                if (is_array($parsed)) $enBase = array_merge($enBase, $parsed);
            }
        }

        foreach ($languages as $lang) {
            // Merge defaults from both storefront and admin locale files
            $defaults = [];
            foreach ([$storefrontDir, $adminDir] as $dir) {
                $file = $dir . '/' . $lang->code . '.json';
                if (file_exists($file)) {
                    $parsed = json_decode(file_get_contents($file), true);
                    if (is_array($parsed)) $defaults = array_merge($defaults, $parsed);
                }
            }

            // If no locale file found for this language, auto-translate from English
            if (empty($defaults) && !empty($enBase) && $lang->code !== 'en') {
                $defaults = $this->autoTranslateBatch($enBase, 'en', $lang->code);
            }

            if (empty($defaults)) {
                $synced[$lang->code] = 0;
                continue;
            }

            // Get existing keys for this language
            $existingKeys = DB::table('language_translations')
                ->when($hasLangId, fn($q) => $q->where('language_id', $lang->id))
                ->when(!$hasLangId, fn($q) => $q->where('language_code', $lang->code))
                ->pluck('key')
                ->toArray();

            // Only insert missing keys
            $missing = array_diff_key($defaults, array_flip($existingKeys));
            $count = 0;

            foreach ($missing as $key => $value) {
                $data = [
                    'key' => $key,
                    'value' => $value,
                    'updated_at' => now(),
                    'created_at' => now(),
                ];
                if ($hasLangId) $data['language_id'] = $lang->id;
                $data['language_code'] = $lang->code;

                DB::table('language_translations')->insert($data);
                $count++;
            }

            $synced[$lang->code] = $count;
        }

        $total = array_sum($synced);
        return $this->successResponse($synced, "Đã đồng bộ {$total} translations mặc định");
    }

    /**
     * Batch auto-translate an array of key => value pairs using Google Translate.
     * Uses a delimiter to translate multiple strings in a single API call to avoid 429 errors.
     */
    private function autoTranslateBatch(array $source, string $from, string $to): array
    {
        $result = [];
        $keys = array_keys($source);
        $values = array_values($source);

        // Translate in chunks of 50 to avoid URL length limits
        $chunks = array_chunk($values, 50);
        $keyChunks = array_chunk($keys, 50);

        foreach ($chunks as $i => $chunk) {
            try {
                // Prepare a single string with delimiter
                // We use " ||| " as a safe delimiter that Google Translate preserves
                $joined = implode(" \n ||| \n ", $chunk);

                $url = 'https://translate.googleapis.com/translate_a/single?client=gtx'
                    . '&sl=' . urlencode($from)
                    . '&tl=' . urlencode($to)
                    . '&dt=t'
                    . '&q=' . urlencode($joined);

                $response = @file_get_contents($url);
                if ($response) {
                    $data = json_decode($response, true);
                    $translated = '';
                    if (!empty($data[0])) {
                        foreach ($data[0] as $segment) {
                            $translated .= $segment[0] ?? '';
                        }
                    }
                    
                    // Split back by delimiter
                    $splitTranslated = explode("|||", $translated);
                    
                    foreach ($chunk as $j => $text) {
                        if (isset($splitTranslated[$j])) {
                            $val = trim($splitTranslated[$j]);
                            // Clean up any stray boundary whitespaces/newlines from GT
                            $val = preg_replace('/^\s*\|\s*/', '', $val);
                            $val = preg_replace('/\s*\|\s*$/', '', $val);
                            $result[$keyChunks[$i][$j]] = $val ?: $text;
                        } else {
                            $result[$keyChunks[$i][$j]] = $text;
                        }
                    }
                } else {
                    foreach ($chunk as $j => $text) {
                        $result[$keyChunks[$i][$j]] = $text;
                    }
                }
            } catch (\Exception $e) {
                // On failure, use source text as fallback
                foreach ($chunk as $j => $text) {
                    if (!isset($result[$keyChunks[$i][$j]])) {
                        $result[$keyChunks[$i][$j]] = $text;
                    }
                }
            }
        }

        return $result;
    }

    // ── Content Translations (products, categories, CMS pages) ──

    public function getContent(string $table, $id)
    {
        try {
            $grouped = ContentTranslation::getGrouped($table, $id);
            return $this->successResponse(['grouped' => $grouped]);
        } catch (\Exception $e) {
            // Table may not exist yet
            return $this->successResponse(['grouped' => []]);
        }
    }

    public function updateContent(Request $request, string $table, $id)
    {
        try {
            $translations = $request->input('translations', []);
            if (empty($translations)) {
                return $this->errorResponse('No translations provided', 422);
            }
            ContentTranslation::upsertGrouped($table, $id, $translations);
            return $this->successResponse(
                ['grouped' => ContentTranslation::getGrouped($table, $id)],
                'Đã lưu bản dịch'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Lỗi lưu bản dịch: ' . $e->getMessage(), 500);
        }
    }

    // ── Auto Translate via Google ──

    public function autoTranslate(Request $request)
    {
        $text = $request->input('text', '');
        $from = $request->input('from', Language::getDefaultCode());
        $to = $request->input('to', 'en');

        if (empty($text)) {
            return $this->errorResponse('Text is required');
        }

        try {
            // Use Google Translate free API (no package needed)
            $url = 'https://translate.googleapis.com/translate_a/single?client=gtx'
                . '&sl=' . urlencode($from)
                . '&tl=' . urlencode($to)
                . '&dt=t'
                . '&q=' . urlencode($text);

            $response = file_get_contents($url);
            $result = json_decode($response, true);

            $translated = '';
            if (!empty($result[0])) {
                foreach ($result[0] as $segment) {
                    $translated .= $segment[0] ?? '';
                }
            }

            return $this->successResponse([
                'translated' => $translated,
                'from' => $from,
                'to' => $to,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Lỗi dịch tự động: ' . $e->getMessage());
        }
    }

    public function autoTranslateBatchApi(Request $request) {
        $texts = $request->input('texts', []); // array of strings
        $from = $request->input('from', Language::getDefaultCode());
        $to = $request->input('to', 'en');

        if (empty($texts) || !is_array($texts)) {
            return $this->errorResponse('Texts array is required');
        }

        try {
            // Convert to assoc array to reuse autoTranslateBatch
            $assoc = [];
            foreach ($texts as $i => $text) {
                if (empty($text)) {
                    $assoc["idx_$i"] = '';
                } else {
                    $assoc["idx_$i"] = $text;
                }
            }
            
            $translatedAssoc = $this->autoTranslateBatch($assoc, $from, $to);
            
            $resultArray = [];
            foreach ($texts as $i => $text) {
                $resultArray[] = $translatedAssoc["idx_$i"] ?? $text;
            }

            return $this->successResponse([
                'translated' => $resultArray,
                'from' => $from,
                'to' => $to,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Lỗi dịch tự động hàng loạt: ' . $e->getMessage());
        }
    }
}
