<?php

namespace App\Services;

use App\Models\Webhook;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * WebhookDeliveryService
 *
 * Dispatches webhook events to registered URLs with HMAC signing
 * and logs delivery attempts.
 */
class WebhookDeliveryService
{
    /**
     * Dispatch a webhook event to all matching webhook URLs.
     */
    public function dispatch(string $event, array $payload): void
    {
        $webhooks = Webhook::where('is_active', true)->get();

        foreach ($webhooks as $webhook) {
            // Check if webhook subscribes to this event
            $eventTypes = $webhook->event_types;
            if (!empty($eventTypes) && is_array($eventTypes) && !in_array($event, $eventTypes) && !in_array('*', $eventTypes)) {
                continue;
            }

            $this->deliver($webhook, $event, $payload);
        }
    }

    /**
     * Deliver a webhook with retry logic.
     */
    private function deliver(Webhook $webhook, string $event, array $payload, int $attempt = 1): void
    {
        $body = json_encode([
            'event' => $event,
            'timestamp' => now()->toISOString(),
            'data' => $payload,
        ]);

        $headers = [
            'Content-Type' => 'application/json',
            'X-Webhook-Event' => $event,
            'X-Webhook-Delivery' => uniqid('wh_'),
        ];

        // HMAC signing
        if (!empty($webhook->secret)) {
            $headers['X-Webhook-Signature'] = hash_hmac('sha256', $body, $webhook->secret);
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders($headers)
                ->withBody($body, 'application/json')
                ->post($webhook->url);

            $this->logDelivery($webhook, $event, $payload, $response->status(), $response->body(), $attempt, $response->successful());

            if (!$response->successful() && $attempt < 3) {
                // Retry with exponential backoff (in queue for production; here inline for simplicity)
                sleep(pow(2, $attempt)); // 2s, 4s
                $this->deliver($webhook, $event, $payload, $attempt + 1);
            }
        } catch (\Throwable $e) {
            $this->logDelivery($webhook, $event, $payload, 0, $e->getMessage(), $attempt, false);

            if ($attempt < 3) {
                sleep(pow(2, $attempt));
                $this->deliver($webhook, $event, $payload, $attempt + 1);
            }

            Log::warning("Webhook delivery failed: {$webhook->url} - {$e->getMessage()}");
        }
    }

    private function logDelivery(Webhook $webhook, string $event, array $payload, int $status, ?string $responseBody, int $attempt, bool $success): void
    {
        try {
            DB::table('webhook_deliveries')->insert([
                'webhook_id' => $webhook->id,
                'event' => $event,
                'payload' => json_encode($payload),
                'response_status' => $status,
                'response_body' => mb_substr($responseBody ?? '', 0, 2000),
                'attempt' => $attempt,
                'success' => $success,
                'delivered_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("Failed to log webhook delivery: {$e->getMessage()}");
        }
    }
}
