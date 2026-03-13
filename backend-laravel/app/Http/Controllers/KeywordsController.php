<?php

namespace App\Http\Controllers;

use App\Repositories\Keyword\KeywordRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class KeywordsController extends Controller
{
    use ApiResponse;

    public function __construct(private KeywordRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate(['keyword' => 'required|string']);
            $keyword = $this->repo->store($data);
            return $this->successResponse($keyword, 'Keyword created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Keyword deleted');
    }
}
