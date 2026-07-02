#!/usr/bin/env bash
# Shared VirusTotal v3 scan helper, used by virustotal-scan.yml and virustotal-rescan.yml.
#
# Usage: vt-scan.sh <new|rescan> <file-path> [display-name]
#   new    - always uploads the file for a fresh analysis (used on release publish)
#   rescan - looks the file up by hash first and forces a re-analysis if VT already
#            knows it (catches vendors updating signatures after the fact), falling
#            back to a full upload if VT has no record of the hash yet
#
# Requires VIRUSTOTAL_API_KEY in the environment. Prints a single JSON object to
# stdout: {name, sha256, malicious, suspicious, undetected, harmless, flagged_vendors, permalink}
set -euo pipefail

MODE="$1"
FILE="$2"
NAME="${3:-$(basename "$FILE")}"

API="https://www.virustotal.com/api/v3"
: "${VIRUSTOTAL_API_KEY:?VIRUSTOTAL_API_KEY not set}"

sha256=$(sha256sum "$FILE" | cut -d' ' -f1)

upload_file() {
  local size upload_target
  size=$(stat -c%s "$FILE")
  if [ "$size" -ge 33554432 ]; then
    # Files >=32MB require requesting a dedicated upload URL first
    upload_target=$(curl -s -H "x-apikey: $VIRUSTOTAL_API_KEY" "$API/files/upload_url" | jq -r '.data')
  else
    upload_target="$API/files"
  fi
  curl -s -H "x-apikey: $VIRUSTOTAL_API_KEY" -F "file=@${FILE}" "$upload_target" | jq -r '.data.id'
}

analysis_id=""
if [ "$MODE" = "rescan" ]; then
  http_status=$(curl -s -o /dev/null -w "%{http_code}" -H "x-apikey: $VIRUSTOTAL_API_KEY" "$API/files/$sha256")
  if [ "$http_status" = "200" ]; then
    analysis_id=$(curl -s -X POST -H "x-apikey: $VIRUSTOTAL_API_KEY" "$API/files/$sha256/analyse" | jq -r '.data.id')
  else
    analysis_id=$(upload_file)
  fi
else
  analysis_id=$(upload_file)
fi

if [ -z "$analysis_id" ] || [ "$analysis_id" = "null" ]; then
  echo "ERROR: failed to start VirusTotal analysis for $NAME" >&2
  exit 1
fi

attempt=0
max_attempts=45
status="queued"
result_json="{}"
while [ "$attempt" -lt "$max_attempts" ]; do
  result_json=$(curl -s -H "x-apikey: $VIRUSTOTAL_API_KEY" "$API/analyses/$analysis_id")
  status=$(echo "$result_json" | jq -r '.data.attributes.status // "unknown"')
  if [ "$status" = "completed" ]; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 20
done

if [ "$status" != "completed" ]; then
  echo "ERROR: VirusTotal analysis for $NAME did not complete in time (last status: $status)" >&2
  exit 2
fi

echo "$result_json" | jq \
  --arg sha256 "$sha256" \
  --arg name "$NAME" \
  --arg permalink "https://www.virustotal.com/gui/file/${sha256}/detection" \
  '{
    name: $name,
    sha256: $sha256,
    malicious: .data.attributes.stats.malicious,
    suspicious: .data.attributes.stats.suspicious,
    undetected: .data.attributes.stats.undetected,
    harmless: .data.attributes.stats.harmless,
    flagged_vendors: [.data.attributes.results | to_entries[] | select(.value.category=="malicious" or .value.category=="suspicious") | .value.engine_name],
    permalink: $permalink
  }'
