<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterRole extends Model
{
    protected $connection = 'master';
    protected $table = 'master_roles';
    protected $guarded = ['id'];

    protected $casts = [
        'permissions' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(MasterUser::class, 'role_id');
    }
}
