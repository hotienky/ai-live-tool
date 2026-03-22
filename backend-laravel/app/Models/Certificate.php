<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = ['enrollment_id', 'course_id', 'certificate_number', 'student_name', 'course_title', 'issued_at', 'template'];
    protected $casts = ['template' => 'array', 'issued_at' => 'datetime'];

    public function enrollment() { return $this->belongsTo(Enrollment::class); }
    public function course() { return $this->belongsTo(Course::class); }
}
