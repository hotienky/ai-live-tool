<?php

namespace App\Http\Controllers;

use App\Repositories\Template\TemplateRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TemplatesController extends Controller
{
    use ApiResponse;

    public function __construct(private TemplateRepositoryInterface $repo) {}

    public function index()
    {
        return $this->successResponse($this->repo->all());
    }

    public function store(Request $request)
    {
        $template = $this->repo->store($request->all());
        return $this->successResponse($template, 'Template created', 201);
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Template deleted');
    }
}
