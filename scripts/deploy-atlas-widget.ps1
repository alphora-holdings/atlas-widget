# ═══════════════════════════════════════════════════════════
# deploy-atlas-widget.ps1
# NinjaOne deployment script for ATLAS Widget (Windows)
#
# Upload this script to NinjaOne ONCE — it auto-discovers the
# latest version from S3, so you never need to update it.
#
# Set to run as: SYSTEM (admin privileges)
# Trigger: Run manually, or attach to a Policy for auto-deploy
# ═══════════════════════════════════════════════════════════

# ─── CONFIG ───
$S3Bucket   = "alphora-atlas-widget-releases"
$S3Region   = "eu-west-1"
$InstallDir = "$env:ProgramFiles\ATLAS Support"

# Deploy mode: "latest" (default) or "rollback" (use previous version)
# Set ATLAS_DEPLOY_MODE=rollback as a NinjaOne script variable or env var to rollback
$DeployMode = if ($env:ATLAS_DEPLOY_MODE) { $env:ATLAS_DEPLOY_MODE } else { "latest" }

if ($DeployMode -eq "rollback") {
    $LatestUrl = "https://${S3Bucket}.s3.${S3Region}.amazonaws.com/previous.json"
} else {
    $LatestUrl = "https://${S3Bucket}.s3.${S3Region}.amazonaws.com/latest.json"
}
# ──────────────

$ErrorActionPreference = "Stop"
$LogFile = "$env:TEMP\atlas-widget-install.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -Append -FilePath $LogFile
}

try {
    Write-Log "=== ATLAS Widget Deployment Starting ==="
    Write-Log "Deploy mode: $DeployMode"

    # ── 0. Fetch latest version info from S3 ──
    Write-Log "Fetching version info from $LatestUrl..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    try {
        $latestJson = Invoke-WebRequest -Uri $LatestUrl -UseBasicParsing | ConvertFrom-Json
        $WidgetVersion = $latestJson.version
        $InstallerUrl  = $latestJson.windows
        Write-Log "Latest version: $WidgetVersion"
        Write-Log "Installer URL: $InstallerUrl"
    } catch {
        throw "Failed to fetch latest version info from S3: $($_.Exception.Message)"
    }

    # Allow env var override (e.g. for testing a specific version)
    if ($env:ATLAS_INSTALLER_URL) {
        $InstallerUrl = $env:ATLAS_INSTALLER_URL
        Write-Log "URL overridden by ATLAS_INSTALLER_URL env var: $InstallerUrl"
    }

    Write-Log "Version: $WidgetVersion"
    Write-Log "URL: $InstallerUrl"

    # ── 1. Check if already installed at this version ──
    $existingExe = "$InstallDir\ATLAS Support.exe"
    if (Test-Path $existingExe) {
        Write-Log "ATLAS Widget already installed. Will reinstall/update."
        # Kill running instance
        Get-Process -Name "ATLAS Support" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
    }

    # ── 2. Download installer ──
    $installerPath = "$env:TEMP\ATLAS-Support-Setup.exe"
    Write-Log "Downloading installer..."
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
    # in the logged-in user's desktop session for the tray icon to appear.
    # Wrapped in try/catch so launch failures don't abort the whole deployment.
    try {
        $loggedInUser = (Get-CimInstance -ClassName Win32_ComputerSystem).UserName
        if ($loggedInUser) {
            Write-Log "Logged-in user detected: $loggedInUser"
            $exePath = "$InstallDir\ATLAS Support.exe"

            $explorerProc = Get-Process -Name explorer -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($explorerProc) {
                $sessionId = $explorerProc.SessionId
                Write-Log "User desktop session ID: $sessionId"

                $taskName = "ATLAS-Widget-Launch"
                $exePathEscaped = "`"$exePath`""
                $startTime = (Get-Date).AddMinutes(2).ToString("HH:mm")

                # Temporarily allow errors so schtasks warnings don't abort
                $ErrorActionPreference = "Continue"
                
                schtasks /Create /TN $taskName /TR $exePathEscaped /SC ONCE /ST $startTime /RU $loggedInUser /IT /F 2>&1 | ForEach-Object { Write-Log "schtasks create: $_" }
                schtasks /Run /TN $taskName 2>&1 | ForEach-Object { Write-Log "schtasks run: $_" }
                Start-Sleep -Seconds 5
                schtasks /Delete /TN $taskName /F 2>&1 | Out-Null
                
                $ErrorActionPreference = "Stop"
                Write-Log "Widget launched for user $loggedInUser via schtasks (session $sessionId)."
            } else {
                Write-Log "No explorer.exe found — user may not have a desktop session."
            }
        } else {
            Write-Log "No logged-in user detected. Widget will start on next login."
        }
    } catch {
        $ErrorActionPreference = "Stop"
        Write-Log "Note: Could not launch widget in user session: $($_.Exception.Message)"
        Write-Log "Widget will start on next login via Startup shortcut."
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

    # ── 7. Clean up ──
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    Write-Log "=== ATLAS Widget Deployment Complete ==="
    Write-Output "SUCCESS: ATLAS Widget $WidgetVersion installed."

} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Stack: $($_.ScriptStackTrace)"
    Write-Output "FAILED: $($_.Exception.Message)"
    exit 1
}
