<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Models\ContentTranslation;
use App\Models\Language;
use App\Models\SupportedLanguage;
use App\Repositories\Language\LanguageRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

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
        return $this->successResponse($language, 'Language created', 201);
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
}
