<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class JobBoardController extends Controller
{
    use ApiResponse;

    /**
     * List all applications globally (for /jobboard/applications route)
     */
    public function allApplications(Request $request)
    {
        if (!Schema::hasTable('job_applications')) {
            return $this->successResponse([]);
        }

        $query = JobApplication::query();
        if ($status = $request->input('status')) $query->where('status', $status);
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('applicant_name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%");
            });
        }
        return $this->successResponse($query->orderBy('applied_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    /**
     * List applications for a specific job
     */
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

    public function showApplication($jobIdOrId, $id = null)
    {
        // Support both /jobboard/applications/{id} and /jobs/{jobId}/applications/{id}
        if ($id === null) {
            return $this->successResponse(JobApplication::findOrFail($jobIdOrId));
        }
        return $this->successResponse(JobApplication::where('job_id', $jobIdOrId)->findOrFail($id));
    }

    public function updateApplication(Request $request, $jobIdOrId, $id = null)
    {
        if ($id === null) {
            $app = JobApplication::findOrFail($jobIdOrId);
        } else {
            $app = JobApplication::where('job_id', $jobIdOrId)->findOrFail($id);
        }
        $app->update($request->only(['status', 'admin_notes', 'rating']));
        return $this->successResponse($app, 'Đã cập nhật');
    }

    public function destroyApplication($jobId, $id)
    {
        JobApplication::where('job_id', $jobId)->findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    public function stats($jobId = null)
    {
        if (!Schema::hasTable('job_applications')) {
            return $this->successResponse(['total' => 0, 'byStatus' => []]);
        }

        $query = JobApplication::query();
        if ($jobId) $query->where('job_id', $jobId);

        $total = $query->count();
        $byStatus = (clone $query)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')->pluck('count', 'status');
        return $this->successResponse(compact('total', 'byStatus'));
    }
}

