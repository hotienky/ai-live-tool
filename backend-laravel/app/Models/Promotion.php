<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model { protected $table = 'promotions'; protected $guarded = ['id']; protected $casts = ['is_active' => 'boolean']; }
