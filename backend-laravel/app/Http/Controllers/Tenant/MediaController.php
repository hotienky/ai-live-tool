<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    /**
     * GET /media — List media with pagination, search, mime filter.
     */
    public function index(Request $request)
    {
        $query = Media::query()->orderByDesc('created_at');

        // Filter by mime type
        if ($type = $request->input('type')) {
            if ($type === 'image') {
                $query->where('mime_type', 'like', 'image/%');
            } elseif ($type === 'video') {
                $query->where('mime_type', 'like', 'video/%');
            } else {
                $query->where('mime_type', 'like', $type . '%');
            }
        }

        // Search by filename or title
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'ilike', "%{$search}%")
                  ->orWhere('title', 'ilike', "%{$search}%")
                  ->orWhere('alt', 'ilike', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('limit', 24), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    /**
     * POST /media/upload — Upload file(s).
     *
     * Flow: Validate → Rename → Store → Process → Record → Response
     */
    public function upload(Request $request)
    {
        // ── 1. Validate ──
        $request->validate([
            'files'   => 'required|array|min:1|max:20',
            'files.*' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,webp,svg,mp4,webm',
        ]);

        $tenantSlug = $this->getTenantSlug();
        $disk = $this->getStorageDisk();
        $results = [];

        foreach ($request->file('files') as $file) {
            try {
                $results[] = $this->processUpload($file, $tenantSlug, $disk);
            } catch (\Exception $e) {
                $results[] = [
                    'error'    => true,
                    'filename' => $file->getClientOriginalName(),
                    'message'  => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'type'    => 'success',
            'message' => count($results) . ' file(s) uploaded',
            'data'    => $results,
        ]);
    }

    /**
     * GET /media/{id} — Show single media.
     */
    public function show($id)
    {
        $media = Media::findOrFail($id);
        return response()->json($media);
    }

    /**
     * PUT /media/{id} — Update alt, title.
     */
    public function update(Request $request, $id)
    {
        $media = Media::findOrFail($id);
        $media->update($request->only(['alt', 'title']));
        return response()->json([
            'type'    => 'success',
            'message' => 'Updated',
            'data'    => $media->fresh(),
        ]);
    }

    /**
     * DELETE /media/{id} — Delete file + thumbnails from disk + DB.
     */
    public function destroy($id)
    {
        $media = Media::findOrFail($id);
        $disk = $media->disk;
        $deleted = [];
        $failed = [];

        // Delete original file
        try {
            if (Storage::disk($disk)->exists($media->path)) {
                Storage::disk($disk)->delete($media->path);
                $deleted[] = $media->path;
            }
        } catch (\Exception $e) {
            $failed[] = $media->path;
            \Illuminate\Support\Facades\Log::warning("Media delete failed: {$media->path} — {$e->getMessage()}");
        }

        // Delete thumbnails
        if (is_array($media->thumbnails)) {
            foreach ($media->thumbnails as $size => $thumbPath) {
                try {
                    if (Storage::disk($disk)->exists($thumbPath)) {
                        Storage::disk($disk)->delete($thumbPath);
                        $deleted[] = $thumbPath;
                    }
                } catch (\Exception $e) {
                    $failed[] = $thumbPath;
                    \Illuminate\Support\Facades\Log::warning("Media thumb delete failed: {$thumbPath} — {$e->getMessage()}");
                }
            }
        }

        $media->delete();

        return response()->json([
            'type'    => 'success',
            'message' => 'Deleted',
            'deleted_files' => $deleted,
        ]);
    }

    // ═══════════════════════════════════════════════════════
    // Private helpers
    // ═══════════════════════════════════════════════════════

    /**
     * Process a single file upload: Rename → Store → Process → Record → Return.
     */
    private function processUpload($file, string $tenantSlug, string $disk): array
    {
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();
        $fileSize = $file->getSize();

        // ── 2. Rename: slug + UUID + timestamp ──
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $slug = Str::slug($baseName);
        $uniqueName = $slug . '_' . Str::random(8) . '_' . time() . '.' . $extension;

        // ── 3. Store: media/{tenant}/{Y}/{m}/ ──
        $year = now()->format('Y');
        $month = now()->format('m');
        $directory = "media/{$tenantSlug}/{$year}/{$month}";
        $path = $file->storeAs($directory, $uniqueName, $disk);

        // ── 4. Process: generate thumbnails for images ──
        $width = null;
        $height = null;
        $thumbnails = [];

        if (str_starts_with($mimeType, 'image/') && $extension !== 'svg') {
            $fullPath = Storage::disk($disk)->path($path);

            // Read dimensions
            $imageInfo = @getimagesize($fullPath);
            if ($imageInfo) {
                $width = $imageInfo[0];
                $height = $imageInfo[1];
            }

            // Generate thumbnails using GD
            $thumbnails = $this->generateThumbnails($fullPath, $directory, $uniqueName, $disk, $imageInfo);
        }

        // ── 5. Record: save to DB ──
        $media = Media::create([
            'filename'   => $originalName,
            'disk'       => $disk,
            'path'       => $path,
            'mime_type'  => $mimeType,
            'size'       => $fileSize,
            'width'      => $width,
            'height'     => $height,
            'alt'        => $baseName,
            'title'      => $baseName,
            'thumbnails' => $thumbnails ?: null,
            'metadata'   => null,
        ]);

        // ── 6. Response: return media data with URLs ──
        return $media->toArray();
    }

    /**
     * Generate thumb (150×150 crop) and medium (600×auto proportional) thumbnails using GD.
     */
    private function generateThumbnails(string $fullPath, string $directory, string $filename, string $disk, $imageInfo): array
    {
        if (!$imageInfo || !function_exists('imagecreatetruecolor')) {
            return [];
        }

        [$origWidth, $origHeight, $type] = $imageInfo;
        $source = $this->createGdImage($fullPath, $type);
        if (!$source) return [];

        $thumbnails = [];
        $baseName = pathinfo($filename, PATHINFO_FILENAME);
        $ext = pathinfo($filename, PATHINFO_EXTENSION);

        // ── Thumb: 150×150 center-crop ──
        $thumbName = $baseName . '_thumb.' . $ext;
        $thumbPath = $directory . '/' . $thumbName;
        $thumb = $this->createCroppedThumbnail($source, $origWidth, $origHeight, 150, 150);
        if ($thumb) {
            $this->saveGdImage($thumb, Storage::disk($disk)->path($thumbPath), $type);
            imagedestroy($thumb);
            $thumbnails['thumb'] = $thumbPath;
        }

        // ── Medium: 600×auto proportional ──
        if ($origWidth > 600) {
            $medName = $baseName . '_medium.' . $ext;
            $medPath = $directory . '/' . $medName;
            $newHeight = (int) round($origHeight * (600 / $origWidth));
            $medium = imagecreatetruecolor(600, $newHeight);
            $this->preserveTransparency($medium, $type);
            imagecopyresampled($medium, $source, 0, 0, 0, 0, 600, $newHeight, $origWidth, $origHeight);
            $this->saveGdImage($medium, Storage::disk($disk)->path($medPath), $type);
            imagedestroy($medium);
            $thumbnails['medium'] = $medPath;
        }

        imagedestroy($source);
        return $thumbnails;
    }

    /**
     * Create a center-cropped thumbnail.
     */
    private function createCroppedThumbnail($source, int $origW, int $origH, int $targetW, int $targetH)
    {
        // Calculate crop area
        $ratio = max($targetW / $origW, $targetH / $origH);
        $cropW = (int) round($targetW / $ratio);
        $cropH = (int) round($targetH / $ratio);
        $cropX = (int) round(($origW - $cropW) / 2);
        $cropY = (int) round(($origH - $cropH) / 2);

        $thumb = imagecreatetruecolor($targetW, $targetH);
        imagecopyresampled($thumb, $source, 0, 0, $cropX, $cropY, $targetW, $targetH, $cropW, $cropH);
        return $thumb;
    }

    /**
     * Create a GD image resource from file.
     */
    private function createGdImage(string $path, int $type)
    {
        return match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG  => @imagecreatefrompng($path),
            IMAGETYPE_GIF  => @imagecreatefromgif($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
            default        => null,
        };
    }

    /**
     * Save a GD image to disk.
     */
    private function saveGdImage($image, string $path, int $type): void
    {
        match ($type) {
            IMAGETYPE_JPEG => imagejpeg($image, $path, 85),
            IMAGETYPE_PNG  => imagepng($image, $path, 8),
            IMAGETYPE_GIF  => imagegif($image, $path),
            IMAGETYPE_WEBP => function_exists('imagewebp') ? imagewebp($image, $path, 85) : null,
            default        => null,
        };
    }

    /**
     * Preserve PNG/GIF transparency in GD canvas.
     */
    private function preserveTransparency($image, int $type): void
    {
        if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
            $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
            imagefilledrectangle($image, 0, 0, imagesx($image), imagesy($image), $transparent);
        }
    }

    /**
     * Get tenant slug for folder organization.
     */
    private function getTenantSlug(): string
    {
        $tenant = tenant();
        if ($tenant) {
            return $tenant->slug ?? $tenant->id ?? 'default';
        }
        return 'default';
    }

    /**
     * Resolve storage disk for current tenant.
     * Builds dynamic disk config from tenant's storage_config credentials.
     */
    private function getStorageDisk(): string
    {
        try {
            $tenant = tenant();
            if (!$tenant) return 'media';

            $driver = $tenant->storage_driver;
            if (!$driver || !in_array($driver, ['s3', 'firebase', 'vstorage'])) {
                return 'media'; // local
            }

            // Build dynamic cloud disk from tenant config
            $config = $tenant->storage_config;
            if (!is_array($config) || empty($config['key']) || empty($config['bucket'])) {
                return 'media'; // incomplete config → fallback local
            }

            $diskName = 'tenant_cloud';
            $diskConfig = [
                'driver' => 's3',
                'key' => $config['key'],
                'secret' => $config['secret'] ?? '',
                'region' => $config['region'] ?? 'us-east-1',
                'bucket' => $config['bucket'],
                'url' => $config['cdn_url'] ?? null,
                'endpoint' => $config['endpoint'] ?? null,
                'use_path_style_endpoint' => ($driver === 'firebase'),
                'throw' => false,
            ];

            // Firebase uses path-style endpoint
            if ($driver === 'firebase' && empty($config['endpoint'])) {
                $diskConfig['endpoint'] = 'https://storage.googleapis.com';
            }

            // Register runtime disk
            \Illuminate\Support\Facades\Config::set("filesystems.disks.{$diskName}", $diskConfig);

            return $diskName;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("getStorageDisk failed: {$e->getMessage()}");
        }

        return 'media';
    }

    /**
     * Check if a disk is cloud-based (not local filesystem).
     */
    private function isCloudDisk(string $disk): bool
    {
        return in_array($disk, ['s3', 'firebase', 'vstorage', 'tenant_cloud']);
    }
}

