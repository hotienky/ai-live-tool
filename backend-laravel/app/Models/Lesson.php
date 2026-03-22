<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'course_id', 'section_id', 'title', 'content', 'sort_order',
        'video_url', 'duration_minutes', 'is_free', 'is_locked', 'unlock_date',
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'is_locked' => 'boolean',
        'unlock_date' => 'date',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }
}
