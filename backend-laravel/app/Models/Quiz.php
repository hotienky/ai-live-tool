<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $fillable = ['lesson_id', 'title', 'passing_score', 'time_limit_minutes', 'max_attempts', 'shuffle_questions'];
    protected $casts = ['shuffle_questions' => 'boolean'];

    public function questions() { return $this->hasMany(QuizQuestion::class)->orderBy('sort_order'); }
    public function lesson() { return $this->belongsTo(Lesson::class); }
    public function attempts() { return $this->hasMany(QuizAttempt::class); }
}
