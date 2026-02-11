#!/bin/bash
# ═══════════════════════════════════════════════════════════
# uninstall-atlas-widget-mac.sh
# NinjaOne script to remove ATLAS Widget from a macOS device.
#
# Upload to NinjaOne > Administration > Scripting > Add New Script
# Language: Shell (Bash)
# Set to run as: Root
# ═══════════════════════════════════════════════════════════

APP_NAME="ATLAS Support"
INSTALL_DIR="/Applications"
PLIST_NAME="com.alphora.atlas-widget"
LOG_FILE="/tmp/atlas-widget-uninstall.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "=== ATLAS Widget macOS Uninstall Starting ==="

# ── 1. Stop running process ──
if pgrep -f "$APP_NAME" > /dev/null 2>&1; then
    log "Stopping ATLAS Widget..."
    pkill -f "$APP_NAME" || true
    sleep 2
fi

# ── 2. Remove LaunchAgent ──
PLIST_PATH="/Library/LaunchAgents/$PLIST_NAME.plist"
if [ -f "$PLIST_PATH" ]; then
    launchctl bootout gui/$(stat -f%u /dev/console) "$PLIST_PATH" 2>/dev/null
    rm -f "$PLIST_PATH"
    log "LaunchAgent removed."
fi

# ── 3. Remove application ──
if [ -d "$INSTALL_DIR/$APP_NAME.app" ]; then
    rm -rf "$INSTALL_DIR/$APP_NAME.app"
    log "Application removed from $INSTALL_DIR."
fi

# ── 4. Clean up app data ──
CURRENT_USER=$(stat -f%Su /dev/console 2>/dev/null || echo "")
if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
    USER_HOME=$(eval echo ~$CURRENT_USER)
    rm -rf "$USER_HOME/Library/Application Support/atlas-widget" 2>/dev/null
    rm -rf "$USER_HOME/Library/Application Support/ATLAS Support" 2>/dev/null
    log "User app data cleaned."
fi

# ── 5. Report to NinjaOne ──
if command -v ninjarmm-cli &> /dev/null; then
    ninjarmm-cli set --name "atlasWidgetInstalled" --value "false" 2>/dev/null
    ninjarmm-cli set --name "atlasWidgetVersion" --value "" 2>/dev/null
    ninjarmm-cli set --name "atlasWidgetInstalledDate" --value "" 2>/dev/null
    log "NinjaOne custom fields updated."
fi

log "=== ATLAS Widget macOS Uninstall Complete ==="
echo "SUCCESS: ATLAS Widget removed."
