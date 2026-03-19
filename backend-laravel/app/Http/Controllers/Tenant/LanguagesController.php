<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Models\ContentTranslation;
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
        $this->repo->delete($id);
        return $this->successResponse(null, 'Language deleted');
    }

    public function getTranslations($id)
    {
        return $this->successResponse($this->repo->getTranslations($id));
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
        $from = $request->input('from', 'vi');
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
