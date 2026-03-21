<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MediaApiController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/media/{id}
     * Get media file info + URL.
     */
    public function show(Request $request, $id)
    {
        $media = DB::table('media')->find($id);

        if (!$media) {
            return $this->notFoundResponse('Media not found.');
        }

        return response()->json([
            'data' => [
                'id' => $media->id,
                'filename' => $media->filename ?? $media->original_name ?? '',
                'mime_type' => $media->mime_type ?? '',
                'size' => $media->size ?? 0,
                'url' => $media->url ?? ($media->path ? Storage::url($media->path) : ''),
                'alt' => $media->alt ?? '',
                'title' => $media->title ?? '',
                'width' => $media->width ?? null,
                'height' => $media->height ?? null,
                'created_at' => $media->created_at,
            ],
        ]);
    }

    /**
     * POST /api/v1/media
     * Upload media file (secret key required).
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:20480', // 20MB max
            'alt' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $path = $file->store('media', 'public');

        $media = DB::table('media')->insertGetId([
            'original_name' => $file->getClientOriginalName(),
            'filename' => basename($path),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'url' => Storage::url($path),
            'alt' => $request->input('alt', ''),
            'title' => $request->input('title', $file->getClientOriginalName()),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'id' => $media,
                'url' => Storage::url($path),
                'filename' => basename($path),
            ],
        ], 201);
    }
}
