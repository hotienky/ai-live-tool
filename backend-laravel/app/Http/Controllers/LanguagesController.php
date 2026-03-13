<?php

namespace App\Http\Controllers;

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
}
