<?php
namespace App\Repositories\ShopCustomer;
use App\Repositories\BaseRepoInterface;
interface ShopCustomerRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
    public function createToken(int $customerId): string;
    public function getAddresses(int $customerId);
    public function createAddress(int $customerId, array $data);
    public function updateAddress(int $customerId, int $addressId, array $data);
    public function deleteAddress(int $customerId, int $addressId): void;
}
