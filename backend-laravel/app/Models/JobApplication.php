<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    protected $fillable = ['job_id', 'applicant_name', 'email', 'phone', 'resume_url', 'cover_letter', 'status', 'extra_info', 'admin_notes', 'rating', 'applied_at'];
    protected $casts = ['extra_info' => 'array', 'applied_at' => 'datetime'];
}
