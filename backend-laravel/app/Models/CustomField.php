<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomField extends Model
{
    protected $guarded = ['id'];
    protected $table = 'custom_fields';

    protected $casts = [
        'options' => 'array',
    ];
}
