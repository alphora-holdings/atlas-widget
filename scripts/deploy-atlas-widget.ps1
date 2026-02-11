# ═══════════════════════════════════════════════════════════
# deploy-atlas-widget.ps1
# NinjaOne deployment script for ATLAS Widget (Windows)
#
# Upload this script to NinjaOne > Administration > Scripting > Add New Script
# Set to run as: SYSTEM (admin privileges)
# Trigger: Run manually, or attach to a Policy for auto-deploy
#
# BEFORE RUNNING:
#   1. Create a GitHub Release at alphora-holdings/atlas-widget with the .exe attached
#   2. Verify the $InstallerUrl below points to the correct release
# ═══════════════════════════════════════════════════════════

# ─── CONFIG ─── Update these values before deploying ───
$InstallerUrl   = $env:ATLAS_INSTALLER_URL
if (-not $InstallerUrl) {
    # GitHub Releases URL (update org/repo if different)
    $InstallerUrl = "https://github.com/alphora-holdings/atlas-widget/releases/download/v1.0.0/ATLAS.Support.Setup.1.0.0.exe"
}
$WidgetVersion  = "1.0.0"
$InstallDir     = "$env:ProgramFiles\ATLAS Support"
# ───────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$LogFile = "$env:TEMP\atlas-widget-install.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -Append -FilePath $LogFile
}

try {
    Write-Log "=== ATLAS Widget Deployment Starting ==="
    Write-Log "Version: $WidgetVersion"
    Write-Log "URL: $InstallerUrl"

    # ── 0. Check if already installed at this version ──
    $existingExe = "$InstallDir\ATLAS Support.exe"
    if (Test-Path $existingExe) {
        Write-Log "ATLAS Widget already installed. Will reinstall/update."
        # Kill running instance
        Get-Process -Name "ATLAS Support" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
    }

    # ── 1. Download installer ──
    $installerPath = "$env:TEMP\ATLAS-Support-Setup.exe"
    Write-Log "Downloading installer..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $InstallerUrl -OutFile $installerPath -UseBasicParsing
    Write-Log "Download complete: $installerPath ($(((Get-Item $installerPath).Length / 1MB).ToString('F1')) MB)"

    # ── 2. Run silent installation ──
    Write-Log "Starting silent installation..."
    $process = Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -ne 0) {
        throw "Installer exited with code $($process.ExitCode)"
    }
    Write-Log "Installation completed successfully."

    # ── 3. Verify installation ──
    if (Test-Path $existingExe) {
        Write-Log "Verified: $existingExe exists."
    } else {
        Write-Log "WARNING: ATLAS Support executable not found at expected path."
    }

    # ── 4. Report to NinjaOne custom fields ──
    try {
        Ninja-Property-Set atlasWidgetInstalled "true"
        Ninja-Property-Set atlasWidgetVersion $WidgetVersion
        Ninja-Property-Set atlasWidgetInstalledDate (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        Write-Log "NinjaOne custom fields updated."
    } catch {
        Write-Log "Note: NinjaOne custom fields not available (running outside NinjaOne?). Skipping."
    }

    # ── 5. Launch the widget for the current logged-in user ──
    # NinjaOne runs scripts as SYSTEM, so we need to start the widget
    # in the logged-in user's session for them to see the tray icon.
    $loggedInUser = (Get-CimInstance -ClassName Win32_ComputerSystem).UserName
    if ($loggedInUser) {
        Write-Log "Logged-in user detected: $loggedInUser"
        $exePath = "$InstallDir\ATLAS Support.exe"

        # Method: Create a scheduled task that runs immediately as the logged-in user
        $taskName = "ATLAS-Widget-Launch"
        $action = New-ScheduledTaskAction -Execute $exePath
        # Extract just the username (DOMAIN\user -> user)
        $userOnly = $loggedInUser
        $principal = New-ScheduledTaskPrincipal -UserId $loggedInUser -LogonType Interactive -RunLevel Limited
        $task = New-ScheduledTask -Action $action -Principal $principal
        Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
        Start-ScheduledTask -TaskName $taskName
        Start-Sleep -Seconds 3
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Log "Widget launched for user $loggedInUser via scheduled task."
    } else {
        Write-Log "No logged-in user detected. Widget will start on next login."
    }

    # ── 6. Ensure auto-start on login ──
    # Create a shortcut in the All Users Startup folder
    $startupDir = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath = "$startupDir\ATLAS Support.lnk"
    if (-not (Test-Path $shortcutPath)) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "$InstallDir\ATLAS Support.exe"
        $shortcut.WorkingDirectory = $InstallDir
        $shortcut.Description = "ATLAS Support Widget"
        $shortcut.Save()
        Write-Log "Startup shortcut created at $shortcutPath"
    }

    # ── 6. Clean up ──
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    Write-Log "=== ATLAS Widget Deployment Complete ==="
    Write-Output "SUCCESS: ATLAS Widget $WidgetVersion installed."

} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Stack: $($_.ScriptStackTrace)"
    Write-Output "FAILED: $($_.Exception.Message)"
    exit 1
}
