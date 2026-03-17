<?php
namespace App\Repositories\Subscriber;

use App\Models\Subscriber;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;

class SubscriberRepository extends BaseEloquentRepository implements SubscriberRepositoryInterface
{
    public function __construct(Subscriber $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email)
    {
        return $this->model->where('email', $email)->first();
    }

    public function subscribe(array $data)
    {
        $existing = $this->findByEmail($data['email']);

        if ($existing) {
            if ($existing->is_active) {
                return ['already_subscribed' => true];
            }
            // Re-subscribe
            $this->model->where('id', $existing->id)->update([
                'is_active' => true,
                'unsubscribed_at' => null,
                'subscribed_at' => now(),
            ]);
            return ['resubscribed' => true];
        }

        return $this->model->create([
            'email' => $data['email'],
            'name' => $data['name'] ?? null,
            'source' => 'newsletter',
            'is_active' => true,
            'subscribed_at' => now(),
        ]);
    }

    public function unsubscribe(string $email): void
    {
        $this->model->where('email', $email)->update([
            'is_active' => false,
            'unsubscribed_at' => now(),
        ]);
    }
}
