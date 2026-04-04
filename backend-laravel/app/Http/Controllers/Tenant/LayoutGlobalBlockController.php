<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LayoutGlobalBlock;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class LayoutGlobalBlockController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $blocks = LayoutGlobalBlock::orderByDesc('id')->get();
        return $this->successResponse($blocks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'ref' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'block_json' => 'nullable|array',
            'translations' => 'nullable|array',
        ]);

        // Check if ref exists
        if (LayoutGlobalBlock::where('ref', $data['ref'])->exists()) {
            return $this->errorResponse('Reference ID đã tồn tại', 400);
        }

        $block = LayoutGlobalBlock::create($data);
        return $this->successResponse($block, 201);
    }

    public function update(Request $request, $id)
    {
        $block = LayoutGlobalBlock::find($id);
        if (!$block) return $this->notFoundResponse('Global Block not found');

        $data = $request->validate([
            'ref' => 'sometimes|string|max:100',
            'name' => 'sometimes|string|max:255',
            'block_json' => 'nullable|array',
            'translations' => 'nullable|array',
        ]);

        if (isset($data['ref']) && $data['ref'] !== $block->ref && LayoutGlobalBlock::where('ref', $data['ref'])->exists()) {
            return $this->errorResponse('Reference ID đã tồn tại', 400);
        }

        $block->update($data);
        return $this->successResponse($block);
    }

    public function destroy($id)
    {
        $block = LayoutGlobalBlock::find($id);
        if (!$block) return $this->notFoundResponse('Global Block not found');

        $block->delete();
        return $this->successResponse(['message' => 'Deleted successfully']);
    }
}
