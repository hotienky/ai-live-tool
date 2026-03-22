<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PointsTransaction extends Model
{
    protected $fillable = ['member_id', 'type', 'points', 'description', 'reference_type', 'reference_id', 'balance_after'];

    public function member() { return $this->belongsTo(Member::class); }
}
