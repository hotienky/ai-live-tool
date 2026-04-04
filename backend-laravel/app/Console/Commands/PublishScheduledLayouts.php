<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LayoutPageVersion;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PublishScheduledLayouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'layout:publish-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan and execute scheduled layout publications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $this->info("Scanning scheduled layouts at {$now->toDateTimeString()}...");

        // Note: LayoutPageVersion does not have tenant_id directly, but it belongs to LayoutPage.
        // We will query directly for versions where status = 'scheduled' and scheduled_at <= now
        $scheduledVersions = LayoutPageVersion::where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now)
            ->with('page')
            ->get();

        if ($scheduledVersions->isEmpty()) {
            $this->info("No scheduled layouts found.");
            return;
        }

        $count = 0;
        foreach ($scheduledVersions as $version) {
            try {
                if ($version->page) {
                    $version->page->executeScheduledPublish($version->id);
                    $count++;
                    $this->info("Published scheduled version {$version->id} for page {$version->page->slug} (Tenant {$version->page->tenant_id})");
                }
            } catch (\Exception $e) {
                Log::error("Failed to publish scheduled layout version {$version->id}: " . $e->getMessage());
                $this->error("Failed to publish scheduled layout version {$version->id}");
            }
        }

        $this->info("Successfully published {$count} scheduled layouts.");
    }
}
