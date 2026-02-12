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
BUNDLE_ID="com.alphora.atlas-widget"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "=== ATLAS Widget macOS Uninstall Starting ==="

# ── 0. Stop running app (tray) more aggressively ──
# pgrep/pkill by name can miss Electron helper processes, or the process name can differ.
# We try bundle id first, then fall back to killing by app path/name.
log "Stopping ATLAS Widget (tray)..."
/usr/bin/pkill -x "ATLAS Support" 2>/dev/null || true
/usr/bin/pkill -f "${INSTALL_DIR}/${APP_NAME}\.app" 2>/dev/null || true
/usr/bin/pkill -f "$APP_NAME" 2>/dev/null || true

# Kill by bundle id if possible
if command -v osascript >/dev/null 2>&1; then
    osascript -e "try" -e "tell application id \"${BUNDLE_ID}\" to quit" -e "end try" 2>/dev/null || true
fi

# Give it a moment to exit cleanly
sleep 2

# As a last resort, kill any remaining Electron helper processes tied to our app
/usr/bin/pkill -f "${APP_NAME} Helper" 2>/dev/null || true
/usr/bin/pkill -f "${APP_NAME} Helper \(Renderer\)" 2>/dev/null || true
/usr/bin/pkill -f "${APP_NAME} Helper \(GPU\)" 2>/dev/null || true

sleep 1

# ── 1. Stop running process (legacy) ──
# (kept for backwards compatibility / logging)
if pgrep -f "$APP_NAME" > /dev/null 2>&1; then
    log "Stopping ATLAS Widget (fallback)..."
    pkill -f "$APP_NAME" || true
    sleep 2
fi

# ── 2. Remove LaunchAgent ──
PLIST_PATH="/Library/LaunchAgents/$PLIST_NAME.plist"
if [ -f "$PLIST_PATH" ]; then
    # bootout for current console user session (best-effort)
    CONSOLE_UID=$(stat -f%u /dev/console 2>/dev/null || echo "")
    if [ -n "$CONSOLE_UID" ]; then
        launchctl bootout "gui/${CONSOLE_UID}" "$PLIST_PATH" 2>/dev/null || true
    fi
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
# The binary is NOT on $PATH — it lives inside the agent bundle.
NINJA_CLI=""
NINJA_CLI_PATHS=(
    "/Applications/NinjaRMMAgent/programdata/ninjarmm-cli"
    "/opt/NinjaRMMAgent/programdata/ninjarmm-cli"
    "/usr/local/bin/ninjarmm-cli"
)
for p in "${NINJA_CLI_PATHS[@]}"; do
    if [ -x "$p" ]; then
        NINJA_CLI="$p"
        break
    fi
done

if [ -n "$NINJA_CLI" ]; then
    log "Found ninjarmm-cli at: $NINJA_CLI"
    "$NINJA_CLI" set --name "atlaswidgetinstalled" --value "false" 2>/dev/null
    "$NINJA_CLI" set --name "atlaswidgetversion" --value "" 2>/dev/null
    "$NINJA_CLI" set --name "atlaswidgetinstalleddate" --value "" 2>/dev/null
    log "NinjaOne custom fields updated."
else
    log "Note: ninjarmm-cli not found in known paths. Custom fields skipped."
fi

log "=== ATLAS Widget macOS Uninstall Complete ==="
echo "SUCCESS: ATLAS Widget removed."
