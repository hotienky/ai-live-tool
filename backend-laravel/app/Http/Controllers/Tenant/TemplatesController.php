<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Template\TemplateRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TemplatesController extends Controller
{
    use ApiResponse;

    public function __construct(private TemplateRepositoryInterface $repo) {}

    public function index()
    {
        try {
            return $this->successResponse($this->repo->all());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function show($id)
    {
        $template = $this->repo->find($id);
        if (!$template) return $this->notFoundResponse('Template not found');
        return $this->successResponse($template);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'content' => 'nullable|string',
                'type' => 'nullable|string|max:50',
                'is_active' => 'nullable|boolean',
            ]);
            $template = $this->repo->store($data);
            return $this->successResponse($template, 'Template created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse(json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $template = $this->repo->find($id);
            if (!$template) return $this->notFoundResponse('Template not found');
            $this->repo->update($request->all(), $id);
            return $this->successResponse($this->repo->find($id), 'Template updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $template = $this->repo->find($id);
            if (!$template) return $this->notFoundResponse('Template not found');
            $this->repo->delete($id);
            return $this->successResponse(null, 'Template deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

