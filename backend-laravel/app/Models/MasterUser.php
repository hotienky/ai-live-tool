<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterUser extends Model
{
    protected $connection = 'master';
    protected $table = 'master_users';
    protected $guarded = ['id'];
    protected $hidden = ['password'];

    protected $searchable = ['name', 'email'];

    public function role()
    {
        return $this->belongsTo(MasterRole::class, 'role_id');
    }
}
