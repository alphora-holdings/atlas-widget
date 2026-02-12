#!/bin/bash
# ═══════════════════════════════════════════════════════════
# rollback.sh — Roll back to any previous version
#
# Usage:
#   ./scripts/rollback.sh              # List all versions, pick one interactively
#   ./scripts/rollback.sh v1.0.0       # Roll back to a specific version directly
#   ./scripts/rollback.sh --list       # Just list all available versions
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

S3_BASE_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com"
LATEST_URL="${S3_BASE_URL}/latest.json"

# ── Show current version ──
echo "📋 Current deployed version:"
CURRENT=$(curl -fsSL "$LATEST_URL" 2>/dev/null) && \
    CURR_VERSION=$(echo "$CURRENT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['version'])" 2>/dev/null) && \
    CURR_RELEASED=$(echo "$CURRENT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['released'])" 2>/dev/null) && \
    echo "   v${CURR_VERSION} (released: ${CURR_RELEASED})" || \
    { echo "   ❌ Could not fetch latest.json"; CURR_VERSION="unknown"; }

# ── List all available versions from S3 ──
echo ""
echo "📦 Available versions on S3:"
VERSIONS=$($AWS_CMD s3 ls "s3://${S3_BUCKET}/versions/" --region "$S3_REGION" 2>/dev/null \
    | grep '\.json$' \
    | awk '{print $4}' \
    | sed 's/\.json$//' \
    | sort -V)

if [[ -z "$VERSIONS" ]]; then
    echo "   ❌ No versioned releases found in s3://${S3_BUCKET}/versions/"
    echo "   Rollback requires at least one release made with the updated release.sh"
    exit 1
fi

# Display versions with numbers
i=1
declare -a VERSION_ARRAY
while IFS= read -r v; do
    VERSION_ARRAY+=("$v")
    if [[ "$v" == "v${CURR_VERSION}" ]]; then
        echo "   $i) $v  ← current"
    else
        echo "   $i) $v"
    fi
    ((i++))
done <<< "$VERSIONS"

# ── List-only mode ──
if [[ "${1:-}" == "--list" ]]; then
    exit 0
fi

# ── Determine target version ──
TARGET_VERSION=""

if [[ -n "${1:-}" ]] && [[ "${1:-}" != "--list" ]]; then
    # Version passed as argument
    TARGET_VERSION="$1"
    # Add 'v' prefix if missing
    [[ "$TARGET_VERSION" != v* ]] && TARGET_VERSION="v${TARGET_VERSION}"
else
    # Interactive: ask user to pick
    echo ""
    read -p "Enter version number (1-${#VERSION_ARRAY[@]}) or version tag (e.g. v1.0.0): " CHOICE

    if [[ "$CHOICE" =~ ^[0-9]+$ ]] && (( CHOICE >= 1 && CHOICE <= ${#VERSION_ARRAY[@]} )); then
        TARGET_VERSION="${VERSION_ARRAY[$((CHOICE-1))]}"
    else
        TARGET_VERSION="$CHOICE"
        [[ "$TARGET_VERSION" != v* ]] && TARGET_VERSION="v${TARGET_VERSION}"
    fi
fi

# ── Validate target version exists ──
VERSION_URL="${S3_BASE_URL}/versions/${TARGET_VERSION}.json"
TARGET_JSON=$(curl -fsSL "$VERSION_URL" 2>/dev/null) || \
    { echo "❌ Version ${TARGET_VERSION} not found at ${VERSION_URL}"; exit 1; }

TARGET_VER=$(echo "$TARGET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])")

if [[ "$TARGET_VER" == "$CURR_VERSION" ]]; then
    echo ""
    echo "ℹ️  v${TARGET_VER} is already the current version. Nothing to do."
    exit 0
fi

# ── Confirm ──
echo ""
echo "⚠️  This will roll back: v${CURR_VERSION} → v${TARGET_VER}"
echo ""
read -p "Are you sure? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# ── Perform rollback: copy versions/vX.X.X.json → latest.json ──
echo ""
echo "🔄 Rolling back to v${TARGET_VER}..."

$AWS_CMD s3 cp "s3://${S3_BUCKET}/versions/${TARGET_VERSION}.json" "s3://${S3_BUCKET}/latest.json" \
    --region "$S3_REGION" \
    --content-type "application/json" \
    --cache-control "no-cache, no-store, must-revalidate"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Rollback complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "latest.json now points to v${TARGET_VER}."
echo "Next NinjaOne deployment will install v${TARGET_VER}."
echo ""
echo "To re-deploy on devices that already have the broken version,"
echo "run the deploy script again via NinjaOne."
echo "═══════════════════════════════════════════════════════════"
