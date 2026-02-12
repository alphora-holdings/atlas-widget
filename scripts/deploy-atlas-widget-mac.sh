#!/bin/bash
# ═══════════════════════════════════════════════════════════
# deploy-atlas-widget-mac.sh
# NinjaOne deployment script for ATLAS Widget (macOS)
#
# Upload this script to NinjaOne ONCE — it auto-discovers the
# latest version from S3, so you never need to update it.
#
# Language: Shell (Bash)
# Set to run as: Root
# ═══════════════════════════════════════════════════════════

# ─── CONFIG ───
S3_BUCKET="alphora-atlas-widget-releases"
S3_REGION="eu-central-1"
APP_NAME="ATLAS Support"
INSTALL_DIR="/Applications"

# Deploy mode:
#   "latest"        → install the newest version (default)
#   "v1.0.0"        → install a specific version (versions/v1.0.0.json)
# Set ATLAS_DEPLOY_MODE as a NinjaOne script variable or env var
DEPLOY_MODE="${ATLAS_DEPLOY_MODE:-latest}"

if echo "$DEPLOY_MODE" | grep -qE '^v?[0-9]+\.[0-9]+\.[0-9]+$'; then
    # Specific version requested (e.g. "v1.0.0" or "1.0.0")
    VER="$DEPLOY_MODE"
    [[ "$VER" != v* ]] && VER="v${VER}"
    LATEST_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/versions/${VER}.json"
else
    LATEST_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/latest.json"
fi
# ──────────────

LOG_FILE="/tmp/atlas-widget-install.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "=== ATLAS Widget macOS Deployment Starting ==="
log "Deploy mode: $DEPLOY_MODE"

# ── 0. Fetch latest version info from S3 ──
log "Fetching version info from $LATEST_URL..."
LATEST_JSON=$(curl -fsSL "$LATEST_URL" 2>&1)
if [ $? -ne 0 ]; then
    log "ERROR: Failed to fetch latest.json from S3: $LATEST_JSON"
    exit 1
fi

WIDGET_VERSION=$(echo "$LATEST_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null)
INSTALLER_URL=$(echo "$LATEST_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['mac'])" 2>/dev/null)

if [ -z "$WIDGET_VERSION" ] || [ -z "$INSTALLER_URL" ]; then
    log "ERROR: Could not parse version/URL from latest.json"
    exit 1
fi

# Allow env var override (e.g. for testing a specific version)
if [ -n "${ATLAS_INSTALLER_URL:-}" ]; then
    INSTALLER_URL="$ATLAS_INSTALLER_URL"
    log "URL overridden by ATLAS_INSTALLER_URL env var: $INSTALLER_URL"
fi

log "Version: $WIDGET_VERSION"
log "URL: $INSTALLER_URL"

# ── 0. Kill running instance ──
if pgrep -f "$APP_NAME" > /dev/null 2>&1; then
    log "Stopping running ATLAS Widget..."
    pkill -f "$APP_NAME" || true
    sleep 2
fi

# ── 1. Download DMG ──
DMG_PATH="/tmp/atlas-widget.dmg"
log "Downloading installer..."
curl -fSL -o "$DMG_PATH" "$INSTALLER_URL"
if [ $? -ne 0 ]; then
    log "ERROR: Download failed"
    exit 1
fi
log "Download complete: $(du -h "$DMG_PATH" | cut -f1)"

# ── 2. Mount DMG ──
MOUNT_POINT="/Volumes/ATLAS-Support-Install"
log "Mounting DMG..."
hdiutil attach "$DMG_PATH" -mountpoint "$MOUNT_POINT" -nobrowse -quiet
if [ $? -ne 0 ]; then
    log "ERROR: Failed to mount DMG"
    exit 1
fi

# ── 3. Copy app to /Applications ──
log "Installing to $INSTALL_DIR..."
if [ -d "$INSTALL_DIR/$APP_NAME.app" ]; then
    log "Removing previous installation..."
    rm -rf "$INSTALL_DIR/$APP_NAME.app"
fi

cp -R "$MOUNT_POINT/$APP_NAME.app" "$INSTALL_DIR/"
if [ $? -ne 0 ]; then
    log "ERROR: Failed to copy app"
    hdiutil detach "$MOUNT_POINT" -quiet
    exit 1
fi
log "App installed to $INSTALL_DIR/$APP_NAME.app"

# ── 4. Unmount DMG ──
hdiutil detach "$MOUNT_POINT" -quiet
rm -f "$DMG_PATH"

# ── 5. Set permissions ──
chmod -R 755 "$INSTALL_DIR/$APP_NAME.app"
chown -R root:wheel "$INSTALL_DIR/$APP_NAME.app"

# ── 6. Remove quarantine (since it's deployed by admin, not user-downloaded) ──
xattr -rd com.apple.quarantine "$INSTALL_DIR/$APP_NAME.app" 2>/dev/null

# ── 7. Create LaunchAgent for auto-start (runs as logged-in user) ──
PLIST_NAME="com.alphora.atlas-widget"
PLIST_PATH="/Library/LaunchAgents/$PLIST_NAME.plist"

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/open</string>
        <string>-a</string>
        <string>$INSTALL_DIR/$APP_NAME.app</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF

chmod 644 "$PLIST_PATH"
chown root:wheel "$PLIST_PATH"
log "LaunchAgent created for auto-start."

# ── 8. Launch the app now for the current user ──
CURRENT_USER=$(stat -f%Su /dev/console 2>/dev/null || echo "")
if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
    log "Launching widget for user: $CURRENT_USER"
    sudo -u "$CURRENT_USER" open "$INSTALL_DIR/$APP_NAME.app" &
fi

# ── 9. Report to NinjaOne (if available) ──
# NinjaOne macOS agent uses `ninjarmm-cli` for custom fields
if command -v ninjarmm-cli &> /dev/null; then
    ninjarmm-cli set --name "atlasWidgetInstalled" --value "true" 2>/dev/null
    ninjarmm-cli set --name "atlasWidgetVersion" --value "$WIDGET_VERSION" 2>/dev/null
    ninjarmm-cli set --name "atlasWidgetInstalledDate" --value "$(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null
    log "NinjaOne custom fields updated."
else
    log "Note: ninjarmm-cli not available. Custom fields skipped."
fi

log "=== ATLAS Widget macOS Deployment Complete ==="
echo "SUCCESS: ATLAS Widget $WIDGET_VERSION installed."
