<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateInstall extends Model
{
    protected $fillable = [
        'template_id',
        'tenant_id',
        'installed_at',
    ];

    protected $casts = [
        'installed_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
