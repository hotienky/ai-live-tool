<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\LmsController;

Route::middleware('module:lms')->group(function () {
    // Courses
    Route::prefix('lms/courses')->group(function () {
        Route::get('/',     [LmsController::class, 'courses']);
        Route::post('/',    [LmsController::class, 'storeCourse']);
        Route::get('/{id}', [LmsController::class, 'showCourse']);
        Route::put('/{id}', [LmsController::class, 'updateCourse']);
        Route::delete('/{id}', [LmsController::class, 'destroyCourse']);

        // Sections
        Route::get('/{courseId}/sections', [LmsController::class, 'sections']);
        Route::post('/{courseId}/sections', [LmsController::class, 'storeSection']);
        Route::put('/{courseId}/sections/{id}', [LmsController::class, 'updateSection']);
        Route::delete('/{courseId}/sections/{id}', [LmsController::class, 'destroySection']);

        // Lessons (nested)
        Route::get('/{courseId}/lessons', [LmsController::class, 'lessons']);
        Route::post('/{courseId}/lessons', [LmsController::class, 'storeLesson']);
        Route::put('/{courseId}/lessons/{id}', [LmsController::class, 'updateLesson']);
        Route::delete('/{courseId}/lessons/{id}', [LmsController::class, 'destroyLesson']);

        // Quizzes (nested under lesson)
        Route::get('/{courseId}/lessons/{lessonId}/quizzes', [LmsController::class, 'quizzes']);
        Route::post('/{courseId}/lessons/{lessonId}/quizzes', [LmsController::class, 'storeQuiz']);
        Route::put('/{courseId}/quizzes/{id}', [LmsController::class, 'updateQuiz']);
        Route::delete('/{courseId}/quizzes/{id}', [LmsController::class, 'destroyQuiz']);
    });

    // Enrollments
    Route::prefix('lms/enrollments')->group(function () {
        Route::get('/',     [LmsController::class, 'enrollments']);
        Route::post('/',    [LmsController::class, 'storeEnrollment']);
        Route::put('/{id}', [LmsController::class, 'updateEnrollment']);
        Route::delete('/{id}', [LmsController::class, 'destroyEnrollment']);
    });

    // Stats
    Route::get('/lms/stats', [LmsController::class, 'stats']);
});

