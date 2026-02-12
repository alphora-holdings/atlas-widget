#!/bin/bash
# ═══════════════════════════════════════════════════════════
# release.sh — Build installers and upload to S3
#
# Usage:
#   ./scripts/release.sh patch    # 1.0.0 → 1.0.1
#   ./scripts/release.sh minor    # 1.0.0 → 1.1.0
#   ./scripts/release.sh major    # 1.0.0 → 2.0.0
#
# Prerequisites:
#   - AWS CLI configured (`aws configure` or env vars)
#   - npm, node installed
#
# What it does:
#   1. Bumps version in package.json
#   2. Builds Windows .exe and macOS .dmg
#   3. Uploads both to S3
#   4. Uploads latest.json to S3 (deploy scripts read this automatically)
#   5. Commits, tags, and pushes to GitHub
#   6. Prints the new S3 URLs
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ─── CONFIG ───
S3_BUCKET="alphora-atlas-widget-releases"
S3_REGION="eu-west-1"  # Change to your region
AWS_PROFILE=""          # Leave empty to use default profile
# ──────────────

BUMP_TYPE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# ── Validate input ──
if [[ -z "$BUMP_TYPE" ]] || [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Usage: ./scripts/release.sh [patch|minor|major]"
    echo ""
    echo "  patch  — bug fix        (1.0.0 → 1.0.1)"
    echo "  minor  — new feature    (1.0.0 → 1.1.0)"
    echo "  major  — breaking change (1.0.0 → 2.0.0)"
    exit 1
fi

# ── Check prerequisites ──
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not installed. Run: brew install awscli"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not installed."; exit 1; }

# Check AWS credentials
AWS_CMD="aws"
if [[ -n "$AWS_PROFILE" ]]; then
    AWS_CMD="aws --profile $AWS_PROFILE"
fi
$AWS_CMD sts get-caller-identity >/dev/null 2>&1 || { echo "❌ AWS credentials not configured. Run: aws configure"; exit 1; }

# ── 1. Bump version ──
echo "📦 Bumping version ($BUMP_TYPE)..."
NEW_VERSION=$(npm version "$BUMP_TYPE" --no-git-tag-version | tr -d 'v')
echo "   New version: $NEW_VERSION"

# ── 2. Build installers ──
echo ""
echo "🔨 Building Windows installer..."
npm run electron:build:win 2>&1 | tail -5

echo ""
echo "🔨 Building macOS installer..."
npm run electron:build:mac 2>&1 | tail -5

# ── Find the built files ──
WIN_INSTALLER="release/ATLAS Support Setup ${NEW_VERSION}.exe"
MAC_INSTALLER="release/ATLAS Support-${NEW_VERSION}-arm64.dmg"

if [[ ! -f "$WIN_INSTALLER" ]]; then
    echo "❌ Windows installer not found at: $WIN_INSTALLER"
    exit 1
fi

if [[ ! -f "$MAC_INSTALLER" ]]; then
    echo "⚠️  macOS installer not found at: $MAC_INSTALLER (skipping macOS upload)"
    MAC_INSTALLER=""
fi

# ── 3. Upload to S3 ──
# S3 key format: v1.2.3/ATLAS-Support-Setup-1.2.3.exe
S3_PREFIX="v${NEW_VERSION}"
S3_WIN_KEY="${S3_PREFIX}/ATLAS-Support-Setup-${NEW_VERSION}.exe"
S3_MAC_KEY="${S3_PREFIX}/ATLAS-Support-${NEW_VERSION}-arm64.dmg"

echo ""
echo "☁️  Uploading to S3 (s3://${S3_BUCKET}/${S3_PREFIX}/)..."

$AWS_CMD s3 cp "$WIN_INSTALLER" "s3://${S3_BUCKET}/${S3_WIN_KEY}" --region "$S3_REGION"
echo "   ✅ Windows: s3://${S3_BUCKET}/${S3_WIN_KEY}"

if [[ -n "$MAC_INSTALLER" ]]; then
    $AWS_CMD s3 cp "$MAC_INSTALLER" "s3://${S3_BUCKET}/${S3_MAC_KEY}" --region "$S3_REGION"
    echo "   ✅ macOS:   s3://${S3_BUCKET}/${S3_MAC_KEY}"
fi

# ── Build the public S3 URLs ──
S3_WIN_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${S3_WIN_KEY}"
S3_MAC_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${S3_MAC_KEY}"

# ── 4. Upload latest.json + versioned copy ──
echo ""
echo "📝 Updating latest.json..."

MAC_URL_JSON=""
if [[ -n "$MAC_INSTALLER" ]]; then
    MAC_URL_JSON="$S3_MAC_URL"
fi

cat > /tmp/atlas-latest.json << EOJSON
{
  "version": "${NEW_VERSION}",
  "windows": "${S3_WIN_URL}",
  "mac": "${MAC_URL_JSON}",
  "released": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOJSON

# Upload as latest.json (what deploy scripts read by default)
$AWS_CMD s3 cp /tmp/atlas-latest.json "s3://${S3_BUCKET}/latest.json" \
    --region "$S3_REGION" \
    --content-type "application/json" \
    --cache-control "no-cache, no-store, must-revalidate"

# Save a versioned copy: versions/v1.2.0.json (permanent, never overwritten)
$AWS_CMD s3 cp /tmp/atlas-latest.json "s3://${S3_BUCKET}/versions/v${NEW_VERSION}.json" \
    --region "$S3_REGION" \
    --content-type "application/json"

rm -f /tmp/atlas-latest.json

echo "   ✅ latest.json → v${NEW_VERSION}"
echo "   ✅ versions/v${NEW_VERSION}.json saved (rollback available)"

# ── 5. Git commit, tag, push ──
echo ""
echo "🔖 Committing and tagging v${NEW_VERSION}..."
git add -A
git commit -m "release: v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
git push origin main
git push origin "v${NEW_VERSION}"

# ── 6. Summary ──
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Release v${NEW_VERSION} complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "S3 URLs:"
echo "  Windows:     ${S3_WIN_URL}"
if [[ -n "$MAC_INSTALLER" ]]; then
    echo "  macOS:       ${S3_MAC_URL}"
fi
echo "  latest.json: https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/latest.json"
echo ""
echo "NinjaOne deploy scripts will automatically use v${NEW_VERSION}."
echo "No need to update scripts in NinjaOne! 🎉"
echo ""
echo "To deploy to devices, just run the existing scripts via NinjaOne."
echo "═══════════════════════════════════════════════════════════"
