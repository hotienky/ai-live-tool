<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    use ApiResponse;

    public function leads()
    {
        return $this->successResponse(DB::table('leads')->get());
    }

    public function comments()
    {
        return $this->successResponse(DB::table('chat_logs')->orderByDesc('created_at')->limit(500)->get());
    }

    public function customers()
    {
        return $this->successResponse(DB::table('customers')->get());
    }

    public function report()
    {
        return $this->successResponse(['message' => 'Report generated']);
    }
}
