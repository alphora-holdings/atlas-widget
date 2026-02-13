/**
 * ATLAS Widget — Electron Main Process
 *
 * Tray icon + tabbed widget window with:
 *   - Ticket submission form
 *   - Device details tab (system info, TeamViewer, NinjaOne)
 */

import {
    app,
    BrowserWindow,
    Tray,
    Menu,
    nativeImage,
    screen,
    ipcMain,
} from 'electron';
import path from 'path';
import { collectDeviceContext } from './device-context';
import { detectLocale, getTranslations } from './i18n';

const WIDGET_WIDTH = 420;
const WIDGET_HEIGHT = 580;

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
    const t = getTranslations(detectLocale(app.getLocale()));

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
    tray.setToolTip(t.trayTooltip);

    tray.setContextMenu(
        Menu.buildFromTemplate([
            { label: t.trayOpen, click: () => showWindow() },
            { type: 'separator' },
            { label: t.trayExit, click: () => app.exit(0) },
        ]),
    );
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
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Load the built renderer from dist/
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);

    mainWindow.on('close', (e) => {
        e.preventDefault();
        mainWindow?.hide();
    });

    mainWindow.on('blur', () => {
        mainWindow?.hide();
    });
}

// ── IPC Handlers ───────────────────────────────────────────

ipcMain.handle('get-device-context', () => {
    return collectDeviceContext();
});

ipcMain.handle('get-config', () => {
    return {
        apiBaseUrl: process.env.ATLAS_API_URL || 'https://staging.alphoraholdings.com/api' || 'http://localhost:3000/api',
    };
});

ipcMain.handle('get-locale', () => {
    return app.getLocale();
});

ipcMain.handle('submit-ticket', async (_event, ticketData) => {
    try {
        const config = {
            apiBaseUrl: process.env.ATLAS_API_URL || 'https://staging.alphoraholdings.com/api' || 'http://localhost:3000/api',
        };
        const response = await fetch(`${config.apiBaseUrl}/rmm/widget/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
        });
        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        }
        return { success: false, error: data.message || 'Submission failed' };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: message };
    }
});

ipcMain.on('hide-window', () => {
    mainWindow?.hide();
});

function showWindow() {
    if (!mainWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(sw - WIDGET_WIDTH - 16, sh - WIDGET_HEIGHT - 16);
    mainWindow.show();
    mainWindow.focus();
}
