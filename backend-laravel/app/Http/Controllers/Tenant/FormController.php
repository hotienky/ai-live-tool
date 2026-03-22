<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Http\Request;

class FormController extends Controller
{
    // List all forms
    public function index()
    {
        $forms = Form::withCount('submissions')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'type' => 'success',
            'data' => $forms,
        ]);
    }

    // Get single form
    public function show($id)
    {
        $form = Form::withCount('submissions')->findOrFail($id);

        return response()->json([
            'type' => 'success',
            'data' => $form,
        ]);
    }

    // Create form
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'fields' => 'required|array|min:1',
        ]);

        $form = Form::create([
            'title' => $request->title,
            'slug' => \Illuminate\Support\Str::slug($request->title) . '-' . time(),
            'fields' => $request->fields,
            'settings' => $request->settings ?? [
                'success_message' => 'Cảm ơn bạn đã gửi form!',
                'email_to' => null,
            ],
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'type' => 'success',
            'data' => $form,
            'message' => 'Đã tạo form',
        ]);
    }

    // Update form
    public function update(Request $request, $id)
    {
        $form = Form::findOrFail($id);

        $form->update($request->only([
            'title', 'fields', 'settings', 'is_active',
        ]));

        return response()->json([
            'type' => 'success',
            'data' => $form->fresh(),
            'message' => 'Đã cập nhật form',
        ]);
    }

    // Delete form
    public function destroy($id)
    {
        Form::findOrFail($id)->delete();

        return response()->json([
            'type' => 'success',
            'message' => 'Đã xóa form',
        ]);
    }

    // Get submissions for a form
    public function submissions($formId)
    {
        $form = Form::findOrFail($formId);
        $submissions = $form->submissions()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'type' => 'success',
            'data' => $submissions,
        ]);
    }

    // Public: submit a form (storefront)
    public function submit(Request $request, $slug)
    {
        $form = Form::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $request->validate([
            'data' => 'required|array',
        ]);

        $submission = FormSubmission::create([
            'form_id' => $form->id,
            'data' => $request->data,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $form->increment('submission_count');

        return response()->json([
            'type' => 'success',
            'message' => $form->settings['success_message'] ?? 'Đã gửi thành công!',
        ]);
    }

    // Mark submission as read
    public function markRead(Request $request, $id)
    {
        $submission = FormSubmission::findOrFail($id);
        $submission->update(['is_read' => true]);

        return response()->json([
            'type' => 'success',
            'data' => $submission,
        ]);
    }

    // Delete submission
    public function deleteSubmission($id)
    {
        FormSubmission::findOrFail($id)->delete();

        return response()->json([
            'type' => 'success',
            'message' => 'Đã xóa',
        ]);
    }
}
