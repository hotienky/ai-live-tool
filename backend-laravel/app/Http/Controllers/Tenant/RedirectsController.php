<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RedirectsController extends Controller
{
    use ApiResponse;

    protected $table = 'seo_redirects';

    public function index()
    {
        try {
            if (!$this->tableExists()) return $this->successResponse([]);
            $redirects = DB::table($this->table)->orderByDesc('created_at')->get();
            return $this->successResponse($redirects);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'source_url' => 'required|string|max:500',
                'target_url' => 'required|string|max:500',
                'status_code' => 'nullable|integer|in:301,302,307',
                'is_active' => 'nullable|boolean',
            ]);
            $this->ensureTable();
            $id = DB::table($this->table)->insertGetId(array_merge($data, [
                'status_code' => $data['status_code'] ?? 301,
                'is_active' => $data['is_active'] ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
            return $this->successResponse(DB::table($this->table)->find($id), 'Redirect created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $this->ensureTable();
            $redirect = DB::table($this->table)->find($id);
            if (!$redirect) return $this->notFoundResponse('Redirect not found');
            DB::table($this->table)->where('id', $id)->update(array_merge($request->all(), ['updated_at' => now()]));
            return $this->successResponse(DB::table($this->table)->find($id), 'Redirect updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $this->ensureTable();
            $redirect = DB::table($this->table)->find($id);
            if (!$redirect) return $this->notFoundResponse('Redirect not found');
            DB::table($this->table)->where('id', $id)->delete();
            return $this->successResponse(null, 'Redirect deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    private function tableExists(): bool
    {
        return \Illuminate\Support\Facades\Schema::hasTable($this->table);
    }

    private function ensureTable(): void
    {
        if (!$this->tableExists()) {
            \Illuminate\Support\Facades\Schema::create($this->table, function ($t) {
                $t->id();
                $t->string('source_url', 500);
                $t->string('target_url', 500);
                $t->integer('status_code')->default(301);
                $t->boolean('is_active')->default(true);
                $t->timestamps();
            });
        }
    }
}
