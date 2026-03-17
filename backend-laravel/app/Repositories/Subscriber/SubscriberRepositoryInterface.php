<?php
namespace App\Repositories\Subscriber;
use App\Repositories\BaseRepoInterface;

interface SubscriberRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
    public function subscribe(array $data);
    public function unsubscribe(string $email): void;
}
