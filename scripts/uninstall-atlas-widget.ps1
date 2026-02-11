# ═══════════════════════════════════════════════════════════
# uninstall-atlas-widget.ps1
# NinjaOne script to remove ATLAS Widget from a Windows device.
#
# Upload to NinjaOne > Administration > Scripting > Add New Script
# Set to run as: SYSTEM
# ═══════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$LogFile = "$env:TEMP\atlas-widget-uninstall.log"
$InstallDir = "$env:ProgramFiles\ATLAS Support"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -Append -FilePath $LogFile
}

try {
    Write-Log "=== ATLAS Widget Uninstall Starting ==="

    # ── 1. Stop running process ──
    Write-Log "Stopping ATLAS Widget process..."
    Get-Process -Name "ATLAS Support" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2

    # ── 2. Run uninstaller (NSIS creates "Uninstall ATLAS Support.exe") ──
    $uninstaller = "$InstallDir\Uninstall ATLAS Support.exe"
    if (Test-Path $uninstaller) {
        Write-Log "Running uninstaller..."
        Start-Process -FilePath $uninstaller -ArgumentList "/S" -Wait -NoNewWindow
        Start-Sleep -Seconds 3
        Write-Log "Uninstaller completed."
    } else {
        Write-Log "Uninstaller not found. Cleaning up manually..."
    }

    # ── 3. Force-clean remaining files ──
    if (Test-Path $InstallDir) {
        Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "Removed install directory."
    }

    # ── 4. Remove startup entries ──
    $startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ATLAS Support.lnk"
    Remove-Item -Path $startupPath -Force -ErrorAction SilentlyContinue
    # Also check all users startup
    $allUsersStartup = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\ATLAS Support.lnk"
    Remove-Item -Path $allUsersStartup -Force -ErrorAction SilentlyContinue
    Write-Log "Startup entries removed."

    # ── 5. Clean environment variables ──
    [System.Environment]::SetEnvironmentVariable("ATLAS_API_URL", $null, "Machine")

    # ── 6. Update NinjaOne custom fields ──
    try {
        Ninja-Property-Set atlasWidgetInstalled "false"
        Ninja-Property-Set atlasWidgetVersion ""
        Ninja-Property-Set atlasWidgetInstalledDate ""
        Write-Log "NinjaOne custom fields updated."
    } catch {
        Write-Log "Note: NinjaOne custom fields not available. Skipping."
    }

    Write-Log "=== ATLAS Widget Uninstall Complete ==="
    Write-Output "SUCCESS: ATLAS Widget removed."

} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Output "FAILED: $($_.Exception.Message)"
    exit 1
}
