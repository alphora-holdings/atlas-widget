#!/bin/bash
# ═══════════════════════════════════════════════════════════
# rollback.sh — Roll back to the previous version
#
# This swaps previous.json → latest.json on S3, so the next
# NinjaOne deployment will use the previous (known-good) version.
#
# Usage:
#   ./scripts/rollback.sh           # Swap previous → latest
#   ./scripts/rollback.sh --check   # Just show what previous.json contains
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ─── CONFIG ───
S3_BUCKET="alphora-atlas-widget-releases"
S3_REGION="eu-west-1"
AWS_PROFILE=""
# ──────────────

AWS_CMD="aws"
if [[ -n "$AWS_PROFILE" ]]; then
    AWS_CMD="aws --profile $AWS_PROFILE"
fi

LATEST_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/latest.json"
PREVIOUS_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/previous.json"

# ── Fetch current state ──
echo "📋 Current state on S3:"
echo ""

echo "   latest.json (what devices install now):"
LATEST=$(curl -fsSL "$LATEST_URL" 2>/dev/null) && \
    echo "   $LATEST" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'     Version:  {d[\"version\"]}'); print(f'     Released: {d[\"released\"]}')" || \
    echo "     ❌ Not found"

echo ""
echo "   previous.json (rollback target):"
PREVIOUS=$(curl -fsSL "$PREVIOUS_URL" 2>/dev/null) && \
    echo "   $PREVIOUS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'     Version:  {d[\"version\"]}'); print(f'     Released: {d[\"released\"]}')" || \
    { echo "     ❌ Not found — nothing to roll back to"; exit 1; }

# ── Check-only mode ──
if [[ "${1:-}" == "--check" ]]; then
    echo ""
    echo "Run without --check to perform the rollback."
    exit 0
fi

# ── Confirm ──
PREV_VERSION=$(echo "$PREVIOUS" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])")
CURR_VERSION=$(echo "$LATEST" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "unknown")

echo ""
echo "⚠️  This will roll back: v${CURR_VERSION} → v${PREV_VERSION}"
echo ""
read -p "Are you sure? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# ── Perform rollback: copy previous.json → latest.json ──
echo ""
echo "🔄 Rolling back..."

$AWS_CMD s3 cp "s3://${S3_BUCKET}/previous.json" "s3://${S3_BUCKET}/latest.json" \
    --region "$S3_REGION" \
    --content-type "application/json" \
    --cache-control "no-cache, no-store, must-revalidate"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Rollback complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "latest.json now points to v${PREV_VERSION}."
echo "Next NinjaOne deployment will install v${PREV_VERSION}."
echo ""
echo "To re-deploy on devices that already have the broken version,"
echo "run the deploy script again via NinjaOne."
echo "═══════════════════════════════════════════════════════════"
