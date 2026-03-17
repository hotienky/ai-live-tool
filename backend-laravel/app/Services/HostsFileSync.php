<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Syncs custom domains for local development.
 *
 * Writes a domains list to a shared file that can be picked up
 * by a host-side script to update /etc/hosts.
 * Also directly updates /etc/hosts if running on the host (non-Docker).
 */
class HostsFileSync
{
    /** Shared file accessible from both Docker and host via volume mount */
    private const DOMAINS_FILE = '/app/storage/custom_domains.txt';

    private const MARKER_START = '# === CUSTOM DOMAINS START ===';
    private const MARKER_END = '# === CUSTOM DOMAINS END ===';

    /**
     * Write all current domains to the shared domains file.
     */
    public function sync(array $domains): void
    {
        try {
            // Write domains list to shared file (accessible via volume mount)
            $lines = [];
            foreach ($domains as $domain) {
                $lines[] = "127.0.0.1 {$domain}";
            }

            $content = self::MARKER_START . "\n"
                . implode("\n", $lines) . "\n"
                . self::MARKER_END . "\n";

            file_put_contents(self::DOMAINS_FILE, $content);

            Log::info('[HostsFileSync] Updated custom_domains.txt with ' . count($domains) . ' domains');
        } catch (\Exception $e) {
            Log::warning('[HostsFileSync] Failed: ' . $e->getMessage());
        }
    }
}
