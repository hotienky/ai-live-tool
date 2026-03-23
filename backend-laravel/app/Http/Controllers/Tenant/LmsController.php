<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Enrollment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LmsController extends Controller
{
    use ApiResponse;

    // ── Courses ──

    public function courses(Request $request)
    {
        $query = Course::withCount(['lessons', 'enrollments']);
        if ($search = $request->input('search')) $query->where('title', 'ilike', "%{$search}%");
        if ($request->input('published')) $query->whereRaw('is_published = true');
        return $this->successResponse($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    public function storeCourse(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'price' => 'numeric|min:0',
            'is_published' => 'boolean',
            'instructor_name' => 'nullable|string|max:255',
            'duration_hours' => 'nullable|integer|min:0',
            'level' => 'nullable|in:beginner,intermediate,advanced',
        ]);
        $data['slug'] = Str::slug($data['title']) . '-' . Str::random(4);
        if (isset($data['is_published'])) $data['is_published'] = (bool) $data['is_published'];
        if (isset($data['certificate_enabled'])) $data['certificate_enabled'] = (bool) $data['certificate_enabled'];
        return $this->successResponse(Course::create($data), 'Đã tạo khóa học', 201);
    }

    public function showCourse($id)
    {
        return $this->successResponse(Course::with('lessons')->withCount('enrollments')->findOrFail($id));
    }

    public function updateCourse(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $data = $request->only([
            'title', 'description', 'featured_image', 'price', 'is_published',
            'instructor_name', 'duration_hours', 'level',
            'certificate_enabled', 'certificate_template', 'prerequisite_id',
        ]);
        if (isset($data['is_published'])) $data['is_published'] = (bool) $data['is_published'];
        if (isset($data['certificate_enabled'])) $data['certificate_enabled'] = (bool) $data['certificate_enabled'];
        $course->update($data);
        return $this->successResponse($course, 'Đã cập nhật');
    }

    public function destroyCourse($id)
    {
        Course::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Sections ──

    public function sections($courseId)
    {
        return $this->successResponse(
            \App\Models\CourseSection::where('course_id', $courseId)->with('lessons')->orderBy('sort_order')->get()
        );
    }

    public function storeSection(Request $request, $courseId)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'sort_order' => 'integer']);
        $data['course_id'] = $courseId;
        return $this->successResponse(\App\Models\CourseSection::create($data), 'Đã tạo chương', 201);
    }

    public function updateSection(Request $request, $courseId, $id)
    {
        $section = \App\Models\CourseSection::where('course_id', $courseId)->findOrFail($id);
        $section->update($request->only(['title', 'sort_order']));
        return $this->successResponse($section, 'Đã cập nhật');
    }

    public function destroySection($courseId, $id)
    {
        \App\Models\CourseSection::where('course_id', $courseId)->findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Lessons ──

    public function lessons($courseId)
    {
        return $this->successResponse(Lesson::where('course_id', $courseId)->with('quizzes')->orderBy('sort_order')->get());
    }

    public function storeLesson(Request $request, $courseId)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string',
            'duration_minutes' => 'nullable|integer',
            'is_free' => 'boolean',
            'is_locked' => 'boolean',
            'unlock_date' => 'nullable|date',
            'section_id' => 'nullable|integer',
            'sort_order' => 'integer',
        ]);
        $data['course_id'] = $courseId;
        $lesson = Lesson::create($data);
        Course::where('id', $courseId)->increment('lesson_count');
        return $this->successResponse($lesson, 'Đã thêm bài học', 201);
    }

    public function updateLesson(Request $request, $courseId, $id)
    {
        $lesson = Lesson::where('course_id', $courseId)->findOrFail($id);
        $lesson->update($request->only([
            'title', 'content', 'video_url', 'duration_minutes', 'is_free',
            'is_locked', 'unlock_date', 'section_id', 'sort_order',
        ]));
        return $this->successResponse($lesson, 'Đã cập nhật');
    }

    public function destroyLesson($courseId, $id)
    {
        Lesson::where('course_id', $courseId)->findOrFail($id)->delete();
        Course::where('id', $courseId)->decrement('lesson_count');
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Quizzes ──

    public function quizzes($courseId, $lessonId)
    {
        return $this->successResponse(
            \App\Models\Quiz::where('lesson_id', $lessonId)->with('questions')->get()
        );
    }

    public function storeQuiz(Request $request, $courseId, $lessonId)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'passing_score' => 'integer|min:0|max:100',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'max_attempts' => 'nullable|integer|min:1',
            'shuffle_questions' => 'boolean',
            'questions' => 'nullable|array',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'in:multiple_choice,true_false,text,multi_select',
            'questions.*.options' => 'nullable|array',
            'questions.*.correct_answer' => 'required',
            'questions.*.points' => 'integer|min:1',
            'questions.*.explanation' => 'nullable|string',
        ]);
        $data['lesson_id'] = $lessonId;
        $questions = $data['questions'] ?? [];
        unset($data['questions']);

        $quiz = \App\Models\Quiz::create($data);

        foreach ($questions as $i => $q) {
            $q['quiz_id'] = $quiz->id;
            $q['sort_order'] = $i;
            $q['correct_answer'] = is_array($q['correct_answer']) ? $q['correct_answer'] : [$q['correct_answer']];
            \App\Models\QuizQuestion::create($q);
        }

        return $this->successResponse($quiz->load('questions'), 'Đã tạo quiz', 201);
    }

    public function updateQuiz(Request $request, $courseId, $id)
    {
        $quiz = \App\Models\Quiz::findOrFail($id);
        $quiz->update($request->only(['title', 'passing_score', 'time_limit_minutes', 'max_attempts', 'shuffle_questions']));

        // Sync questions if provided
        if ($request->has('questions')) {
            $quiz->questions()->delete();
            foreach ($request->questions as $i => $q) {
                $q['quiz_id'] = $quiz->id;
                $q['sort_order'] = $i;
                $q['correct_answer'] = is_array($q['correct_answer']) ? $q['correct_answer'] : [$q['correct_answer']];
                \App\Models\QuizQuestion::create($q);
            }
        }

        return $this->successResponse($quiz->load('questions'), 'Đã cập nhật');
    }

    public function destroyQuiz($courseId, $id)
    {
        \App\Models\Quiz::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Enrollments (Students) ──

    public function enrollments(Request $request)
    {
        $query = Enrollment::with('course');
        if ($courseId = $request->input('course_id')) $query->where('course_id', $courseId);
        if ($status = $request->input('status')) $query->where('status', $status);
        return $this->successResponse($query->orderBy('enrolled_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    public function storeEnrollment(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'student_name' => 'required|string|max:255',
            'student_email' => 'nullable|email',
            'student_phone' => 'nullable|string|max:20',
        ]);
        $enrollment = Enrollment::create($data);
        Course::where('id', $data['course_id'])->increment('enrollment_count');
        return $this->successResponse($enrollment, 'Đã ghi danh', 201);
    }

    public function updateEnrollment(Request $request, $id)
    {
        $enrollment = Enrollment::findOrFail($id);
        $enrollment->update($request->only(['status', 'progress_percent', 'completed_at']));
        return $this->successResponse($enrollment, 'Đã cập nhật');
    }

    public function destroyEnrollment($id)
    {
        $enrollment = Enrollment::findOrFail($id);
        Course::where('id', $enrollment->course_id)->decrement('enrollment_count');
        $enrollment->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Stats ──

    public function stats()
    {
        try {
            $totalCourses = Course::count();
            $publishedCourses = Course::whereRaw("is_published = true")->count();
            $totalEnrollments = Enrollment::count();
            $completedEnrollments = Enrollment::where('status', 'completed')->count();
            $totalLessons = Lesson::count();
            $topCourses = Course::orderBy('enrollment_count', 'desc')->limit(5)->get(['id', 'title', 'enrollment_count']);

            return $this->successResponse(compact(
                'totalCourses', 'publishedCourses', 'totalEnrollments', 'completedEnrollments', 'totalLessons', 'topCourses'
            ));
        } catch (\Exception $e) {
            return $this->successResponse([
                'totalCourses' => 0, 'publishedCourses' => 0,
                'totalEnrollments' => 0, 'completedEnrollments' => 0,
                'totalLessons' => 0, 'topCourses' => [],
            ]);
        }
    }
}

