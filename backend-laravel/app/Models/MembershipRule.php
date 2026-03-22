<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class MembershipRule extends Model
{
    protected $fillable = ['action', 'points_per_unit', 'unit_amount', 'conditions', 'is_active', 'description'];
    protected $casts = ['conditions' => 'array', 'is_active' => 'boolean', 'points_per_unit' => 'decimal:2', 'unit_amount' => 'decimal:2'];
}
