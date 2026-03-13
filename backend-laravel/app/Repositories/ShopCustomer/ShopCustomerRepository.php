<?php
namespace App\Repositories\ShopCustomer;
use App\Models\ShopCustomer;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShopCustomerRepository extends BaseEloquentRepository implements ShopCustomerRepositoryInterface
{
    public function __construct(ShopCustomer $model) { parent::__construct($model); }

    public function findByEmail(string $email)
    {
        return $this->model->where('email', $email)->first();
    }

    public function createToken(int $customerId): string
    {
        $token = Str::random(64);
        DB::table('shop_customer_tokens')->insert([
            'customer_id' => $customerId,
            'token' => hash('sha256', $token),
            'expires_at' => now()->addDays(30),
            'created_at' => now(),
        ]);
        return $token;
    }

    public function getAddresses(int $customerId)
    {
        return DB::table('shop_customer_addresses')
            ->where('shop_customer_id', $customerId)->get();
    }

    public function createAddress(int $customerId, array $data)
    {
        $data['shop_customer_id'] = $customerId;
        $data['created_at'] = now();
        $id = DB::table('shop_customer_addresses')->insertGetId($data);
        return DB::table('shop_customer_addresses')->where('id', $id)->first();
    }

    public function updateAddress(int $customerId, int $addressId, array $data)
    {
        DB::table('shop_customer_addresses')
            ->where('id', $addressId)
            ->where('shop_customer_id', $customerId)
            ->update($data);
        return DB::table('shop_customer_addresses')->where('id', $addressId)->first();
    }

    public function deleteAddress(int $customerId, int $addressId): void
    {
        DB::table('shop_customer_addresses')
            ->where('id', $addressId)
            ->where('shop_customer_id', $customerId)
            ->delete();
    }
}
