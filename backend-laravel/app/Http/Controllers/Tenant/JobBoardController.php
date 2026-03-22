<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class JobBoardController extends Controller
{
    use ApiResponse;

    public function applications(Request $request, $jobId)
    {
        $query = JobApplication::where('job_id', $jobId);
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('applicant_name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%");
            });
        }
        return $this->successResponse($query->orderBy('applied_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    public function showApplication($jobId, $id)
    {
        return $this->successResponse(JobApplication::where('job_id', $jobId)->findOrFail($id));
    }

    public function updateApplication(Request $request, $jobId, $id)
    {
        $app = JobApplication::where('job_id', $jobId)->findOrFail($id);
        $app->update($request->only(['status', 'admin_notes', 'rating']));
        return $this->successResponse($app, 'Đã cập nhật');
    }

    public function destroyApplication($jobId, $id)
    {
        JobApplication::where('job_id', $jobId)->findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    public function stats($jobId)
    {
        $total = JobApplication::where('job_id', $jobId)->count();
        $byStatus = JobApplication::where('job_id', $jobId)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')->pluck('count', 'status');
        return $this->successResponse(compact('total', 'byStatus'));
    }
}
