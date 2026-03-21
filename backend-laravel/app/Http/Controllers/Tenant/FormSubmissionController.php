<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FormSubmission;
use Illuminate\Http\Request;

class FormSubmissionController extends Controller
{
    /**
     * Store a new form submission (public endpoint).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            '_form_title' => 'sometimes|string|max:255',
        ]);

        $data = $request->except(['_form_title', '_token']);

        $submission = FormSubmission::create([
            'form_title' => $validated['_form_title'] ?? 'Unknown Form',
            'data' => $data,
            'source_page' => $request->header('Referer'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Fire webhook
        try {
            app(\App\Services\WebhookDeliveryService::class)->dispatch('form.submitted', [
                'form_title' => $submission->form_title,
                'submission_id' => $submission->id,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Form webhook failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Form submitted successfully.',
        ], 201);
    }

    /**
     * List all submissions (admin).
     */
    public function index(Request $request)
    {
        $query = FormSubmission::orderBy('created_at', 'desc');

        if ($form = $request->input('form_title')) {
            $query->where('form_title', $form);
        }

        if ($request->input('unread')) {
            $query->unread();
        }

        return response()->json([
            'data' => $query->paginate($request->input('per_page', 20)),
        ]);
    }

    /**
     * Show single submission.
     */
    public function show($id)
    {
        $submission = FormSubmission::findOrFail($id);
        $submission->markAsRead();

        return response()->json(['data' => $submission]);
    }

    /**
     * Delete submission.
     */
    public function destroy($id)
    {
        FormSubmission::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    /**
     * Export submissions as CSV.
     */
    public function export(Request $request)
    {
        $query = FormSubmission::orderBy('created_at', 'desc');

        if ($form = $request->input('form_title')) {
            $query->where('form_title', $form);
        }

        $submissions = $query->get();
        if ($submissions->isEmpty()) {
            return response()->json(['message' => 'No submissions found.'], 404);
        }

        // Collect all data keys
        $allKeys = [];
        foreach ($submissions as $sub) {
            if (is_array($sub->data)) {
                $allKeys = array_merge($allKeys, array_keys($sub->data));
            }
        }
        $allKeys = array_unique($allKeys);

        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, array_merge(['ID', 'Form', 'Date', 'IP'], $allKeys));

        foreach ($submissions as $sub) {
            $row = [$sub->id, $sub->form_title, $sub->created_at, $sub->ip_address];
            foreach ($allKeys as $key) {
                $row[] = $sub->data[$key] ?? '';
            }
            fputcsv($csv, $row);
        }

        rewind($csv);
        $content = stream_get_contents($csv);
        fclose($csv);

        return response($content)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="form-submissions.csv"');
    }
}
