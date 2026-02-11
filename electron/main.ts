/**
 * ATLAS Widget — Minimal Electron Main Process
 *
 * Phase 0: Tray icon + simple hello world popup.
 * The full implementation (form, device context, API) is in the other source files
 * and will be wired in once this is deployed and running.
 */

import {
    app,
    BrowserWindow,
    Tray,
    Menu,
    nativeImage,
    screen,
} from 'electron';
import path from 'path';

const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 300;

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

// ── Prevent multiple instances ─────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) showWindow();
    });
}

// ── App ready ──────────────────────────────────────────────
app.whenReady().then(() => {
    createTray();
    createWindow();

    // Hide dock icon on macOS (tray-only app)
    if (process.platform === 'darwin') {
        app.dock?.hide();
    }
});

app.on('window-all-closed', () => {
    // Stay alive in tray — don't quit
});

// ── Tray ───────────────────────────────────────────────────
function createTray() {
    // Try to load icon from assets, fall back to a generated one
    const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
    let icon: Electron.NativeImage;

    try {
        icon = nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) throw new Error('empty');
    } catch {
        icon = createFallbackIcon();
    }

    // macOS needs a 16x16 template image for the menu bar
    if (process.platform === 'darwin') {
        icon = icon.resize({ width: 16, height: 16 });
        icon.setTemplateImage(true);
    }

    tray = new Tray(icon);
    tray.setToolTip('ATLAS Support — Click for help');

    tray.setContextMenu(
        Menu.buildFromTemplate([
            { label: '📧  Open ATLAS Support', click: () => showWindow() },
            { type: 'separator' },
            { label: '❌  Exit', click: () => app.exit(0) },
        ]),
    );

    // Left-click = show window
    tray.on('click', () => showWindow());
}

function createFallbackIcon(): Electron.NativeImage {
    const s = 32;
    const buf = Buffer.alloc(s * s * 4);
    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const dx = x - s / 2;
            const dy = y - s / 2;
            const i = (y * s + x) * 4;
            if (Math.sqrt(dx * dx + dy * dy) <= s / 2 - 1) {
                buf[i] = 0x3b; buf[i + 1] = 0x82; buf[i + 2] = 0xf6; buf[i + 3] = 0xff;
            }
        }
    }
    return nativeImage.createFromBuffer(buf, { width: s, height: s });
}

// ── Window ─────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: WIDGET_WIDTH,
        height: WIDGET_HEIGHT,
        show: false,
        frame: false,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load a simple inline HTML page
    mainWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(HELLO_HTML)}`,
    );

    mainWindow.on('close', (e) => {
        e.preventDefault();
        mainWindow?.hide();
    });

    mainWindow.on('blur', () => {
        mainWindow?.hide();
    });
}

function showWindow() {
    if (!mainWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(sw - WIDGET_WIDTH - 16, sh - WIDGET_HEIGHT - 16);
    mainWindow.show();
    mainWindow.focus();
}

// ── Inline HTML ────────────────────────────────────────────
const HELLO_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: #0f172a;
    color: #f1f5f9;
    height: 100vh;
    display: flex;
    flex-direction: column;
    -webkit-app-region: drag;
    user-select: none;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-bottom: 1px solid #334155;
  }
  .logo {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 15px; color: #fff;
    box-shadow: 0 2px 8px rgba(59,130,246,0.3);
  }
  .title { font-weight: 600; font-size: 14px; }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 20px;
    text-align: center;
  }
  .emoji { font-size: 48px; animation: wave 2s ease-in-out infinite; transform-origin: 70% 70%; }
  @keyframes wave {
    0%,60%,100%{transform:rotate(0)}
    10%{transform:rotate(14deg)}
    20%{transform:rotate(-8deg)}
    30%{transform:rotate(14deg)}
    40%{transform:rotate(-4deg)}
    50%{transform:rotate(10deg)}
  }
  h1 { font-size: 22px; font-weight: 700; }
  p { color: #94a3b8; font-size: 13px; line-height: 1.5; }
  .badge {
    margin-top: 8px;
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.3);
    color: #60a5fa;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .footer {
    padding: 10px 18px;
    border-top: 1px solid #334155;
    font-size: 11px;
    color: #64748b;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">A</div>
    <span class="title">ATLAS Support</span>
  </div>
  <div class="content">
    <div class="emoji">👋</div>
    <h1>Hello from ATLAS!</h1>
    <p>The support widget is running.<br/>Ticket form coming soon.</p>
    <div class="badge">v1.0.0 — CONNECTED</div>
  </div>
  <div class="footer">Click outside to close · Right-click tray for menu</div>
</body>
</html>`;
