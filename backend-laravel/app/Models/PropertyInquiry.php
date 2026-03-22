<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PropertyInquiry extends Model
{
    protected $fillable = ['listing_id', 'name', 'email', 'phone', 'message', 'status', 'admin_notes'];
}
