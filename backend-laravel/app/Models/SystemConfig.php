<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SystemConfig extends Model { protected $table = 'system_configs'; protected $guarded = ['id']; public $timestamps = false; }
