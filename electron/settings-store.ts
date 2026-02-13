/**
 * ATLAS Widget — Settings Store
 *
 * Simple JSON-file-based persistent settings storage.
 * Stores user preferences (toggle states, etc.) in the app's userData directory.
 *
 * File location:
 *   - macOS: ~/Library/Application Support/atlas-widget/settings.json
 *   - Windows: %APPDATA%/atlas-widget/settings.json
 *   - Linux: ~/.config/atlas-widget/settings.json
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// ── Settings Schema ────────────────────────────────────────

export interface WidgetSettings {
    /** Privacy: share device context with support tickets */
    shareDeviceContext: boolean;
    /** Privacy: send anonymous error reports */
    sendErrorReports: boolean;
    /** Privacy: auto-capture screenshots on ticket submission */
    autoScreenshots: boolean;
    /** Notifications: show tips & hints */
    showTips: boolean;
    /** Notifications: show ticket status updates */
    ticketUpdates: boolean;
}

const DEFAULTS: WidgetSettings = {
    shareDeviceContext: true,
    sendErrorReports: true,
    autoScreenshots: false,
    showTips: true,
    ticketUpdates: true,
};

// ── Store Implementation ───────────────────────────────────

const SETTINGS_FILE = 'settings.json';

function getSettingsPath(): string {
    return path.join(app.getPath('userData'), SETTINGS_FILE);
}

/**
 * Load settings from disk. Returns defaults for any missing keys.
 */
export function loadSettings(): WidgetSettings {
    try {
        const filePath = getSettingsPath();
        if (!fs.existsSync(filePath)) {
            return { ...DEFAULTS };
        }
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Merge with defaults so new keys are always present
        return { ...DEFAULTS, ...parsed };
    } catch (err) {
        console.warn('Failed to load settings, using defaults:', err);
        return { ...DEFAULTS };
    }
}

/**
 * Save settings to disk. Merges partial updates with existing settings.
 */
export function saveSettings(partial: Partial<WidgetSettings>): WidgetSettings {
    const current = loadSettings();
    const updated = { ...current, ...partial };
    try {
        const filePath = getSettingsPath();
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
        console.error('Failed to save settings:', err);
    }
    return updated;
}

/**
 * Get a single setting value.
 */
export function getSetting<K extends keyof WidgetSettings>(key: K): WidgetSettings[K] {
    return loadSettings()[key];
}

/**
 * Set a single setting value and persist.
 */
export function setSetting<K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]): void {
    saveSettings({ [key]: value });
}
