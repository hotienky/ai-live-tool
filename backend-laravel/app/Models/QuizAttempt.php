<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $fillable = ['quiz_id', 'enrollment_id', 'answers', 'score', 'correct_count', 'total_questions', 'passed', 'started_at', 'completed_at'];
    protected $casts = ['answers' => 'array', 'passed' => 'boolean', 'started_at' => 'datetime', 'completed_at' => 'datetime'];

    public function quiz() { return $this->belongsTo(Quiz::class); }
    public function enrollment() { return $this->belongsTo(Enrollment::class); }
}
