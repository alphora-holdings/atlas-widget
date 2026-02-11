# ATLAS Widget

Electron desktop app for IT support ticket submission, deployed via NinjaRMM.

## Features

- **System tray** app with `Ctrl+Shift+H` hotkey
- Structured ticket submission (category, description, urgency)
- Auto-collects device context (NinjaOne ID, TeamViewer ID, OS, IP)
- Submits to alphora-core backend for AI processing
- Silent install via NinjaRMM deployment scripts

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (Vite + Electron)
npm run electron:dev

# Build for production (Windows .exe)
npm run electron:build:win
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ATLAS_API_URL` | `http://localhost:3000/api` | Backend API base URL |

## Deployment via NinjaRMM

```powershell
# Deploy to devices
.\scripts\deploy-atlas-widget.ps1 -ApiBaseUrl "https://api.alphora.com/api"

# Uninstall from devices
.\scripts\uninstall-atlas-widget.ps1
```

## Project Structure

```
atlas-widget/
├── electron/
│   ├── main.ts              # Electron main process (tray, window, IPC)
│   ├── preload.ts            # Bridge between main & renderer
│   └── device-context.ts     # Reads NinjaOne/TeamViewer IDs from registry
├── src/
│   ├── index.html            # Ticket submission form
│   ├── style.css             # Dark theme styling
│   └── main.ts               # Form logic and API calls
├── scripts/
│   ├── deploy-atlas-widget.ps1
│   └── uninstall-atlas-widget.ps1
└── assets/
    └── tray-icon.png
```
