<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    protected $fillable = ['quiz_id', 'question', 'type', 'options', 'correct_answer', 'sort_order', 'points', 'explanation'];
    protected $casts = ['options' => 'array', 'correct_answer' => 'array'];

    public function quiz() { return $this->belongsTo(Quiz::class); }
}
