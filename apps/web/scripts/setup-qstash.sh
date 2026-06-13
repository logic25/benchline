#!/usr/bin/env bash
# Set up Upstash QStash schedules to replace Vercel cron's frequency limit on Hobby plan.
#
# Vercel Hobby only allows once-daily crons. We keep one daily cron on Vercel
# for the insurance-expiry sweep, and offload the more frequent jobs (auto-release
# every 15 min, day-of reminders hourly during NYC business hours) to QStash.
#
# Prerequisites:
#   - QSTASH_TOKEN exported (from console.upstash.com/qstash → Tokens)
#   - APP_URL set to your production URL (e.g. https://app.benchline.co)
#   - CRON_SECRET set to the same value as Vercel's CRON_SECRET env var
#
# Run once after first production deploy. Re-running is idempotent only if you
# first list & delete existing schedules — see README in this directory.

set -euo pipefail

: "${QSTASH_TOKEN:?Set QSTASH_TOKEN}"
: "${APP_URL:?Set APP_URL, e.g. https://app.benchline.co}"
: "${CRON_SECRET:?Set CRON_SECRET to match Vercel}"

create_schedule() {
  local path="$1"
  local cron="$2"
  echo ">>> creating schedule for $path ($cron)"
  curl -sS -X POST "https://qstash.upstash.io/v2/schedules/${APP_URL}${path}" \
    -H "Authorization: Bearer $QSTASH_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Upstash-Cron: $cron" \
    -H "Upstash-Method: GET" \
    -H "Upstash-Forward-Authorization: Bearer $CRON_SECRET"
  echo
}

# 1. Auto-release: every 15 minutes, all day, all year
create_schedule "/api/cron/auto-release" "*/15 * * * *"

# 2. Day-of reminders: hourly 7am-11am ET (11-15 UTC), every day
create_schedule "/api/cron/day-of-reminders" "0 11-15 * * *"

echo "QStash schedules created. List them with:"
echo "  curl -H 'Authorization: Bearer \$QSTASH_TOKEN' https://qstash.upstash.io/v2/schedules"
