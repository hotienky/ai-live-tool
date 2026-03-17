#!/bin/bash
# ═══════════════════════════════════════════════════════════
# sync-domains.sh — Sync custom domains to /etc/hosts
#
# Usage:
#   ./scripts/sync-domains.sh         # One-time sync
#   ./scripts/sync-domains.sh --watch # Watch for changes
#
# This reads backend-laravel/storage/custom_domains.txt
# and updates /etc/hosts with the managed section.
# ═══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOMAINS_FILE="$PROJECT_DIR/backend-laravel/storage/custom_domains.txt"
HOSTS_FILE="/etc/hosts"
MARKER_START="# === CUSTOM DOMAINS START ==="
MARKER_END="# === CUSTOM DOMAINS END ==="

sync_hosts() {
    if [ ! -f "$DOMAINS_FILE" ]; then
        echo "⚠️  No custom_domains.txt found"
        return
    fi

    local managed_block
    managed_block=$(cat "$DOMAINS_FILE")

    local current_hosts
    current_hosts=$(cat "$HOSTS_FILE")

    # Remove existing managed section
    local cleaned
    cleaned=$(echo "$current_hosts" | sed "/$MARKER_START/,/$MARKER_END/d")

    # Append new managed section
    local new_hosts
    new_hosts=$(printf '%s\n\n%s\n' "$(echo "$cleaned" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}')" "$managed_block")

    # Write (requires sudo)
    echo "$new_hosts" | sudo tee "$HOSTS_FILE" > /dev/null

    local count
    count=$(grep -c "127.0.0.1" "$DOMAINS_FILE" 2>/dev/null || echo "0")
    echo "✅ Synced $count domain(s) to /etc/hosts"
}

# One-time sync
sync_hosts

# Watch mode
if [ "$1" = "--watch" ]; then
    echo "👀 Watching for changes... (Ctrl+C to stop)"
    if command -v fswatch &> /dev/null; then
        fswatch -o "$DOMAINS_FILE" | while read -r; do
            echo "🔄 Change detected, syncing..."
            sync_hosts
        done
    else
        echo "ℹ️  Install fswatch for auto-watch: brew install fswatch"
        echo "   Falling back to polling (every 2s)..."
        LAST_HASH=""
        while true; do
            if [ -f "$DOMAINS_FILE" ]; then
                CURRENT_HASH=$(md5 -q "$DOMAINS_FILE" 2>/dev/null || md5sum "$DOMAINS_FILE" | cut -d' ' -f1)
                if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
                    echo "🔄 Change detected, syncing..."
                    sync_hosts
                    LAST_HASH="$CURRENT_HASH"
                fi
            fi
            sleep 2
        done
    fi
fi
