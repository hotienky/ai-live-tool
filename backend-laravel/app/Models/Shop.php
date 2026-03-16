<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    protected $table = 'shops';

    protected $fillable = [
        'name', 'domain', 'description', 'logo', 'email',
        'phone', 'address', 'settings', 'is_active', 'user_id',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /* Relationships */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function customers()
    {
        return $this->hasMany(ShopCustomer::class);
    }

    /* Scopes */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
