/**
 * Preload script — bridge between Electron main process and renderer.
 *
 * Exposes safe APIs to the renderer via contextBridge so the web page
 * can access device context and submit tickets without Node.js access.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('atlasAPI', {
    /**
     * Get device context collected by the main process.
     */
    getDeviceContext: () => ipcRenderer.invoke('get-device-context'),

    /**
     * Submit a ticket to the backend API.
     */
    submitTicket: (ticketData: Record<string, unknown>) =>
        ipcRenderer.invoke('submit-ticket', ticketData),

    /**
     * Fetch submitted tickets for a user from the backend API.
     */
    getTickets: (email: string) =>
        ipcRenderer.invoke('get-tickets', email),

    /**
     * Resolve a user's email from their NinjaOne device ID.
     * Used on macOS where Active Directory domain is unavailable.
     */
    resolveEmail: (ninjaDeviceId: number) =>
        ipcRenderer.invoke('resolve-email', ninjaDeviceId),

    /**
     * Get the configured API base URL.
     */
    getConfig: () => ipcRenderer.invoke('get-config'),

    /**
     * Get the system locale (e.g. 'en-US', 'de-DE').
     */
    getLocale: () => ipcRenderer.invoke('get-locale'),

    /**
     * Close the widget window (minimize to tray).
     */
    hideWindow: () => ipcRenderer.send('hide-window'),

    /**
     * Listen for events from the main process.
     */
    onMessage: (callback: (event: string, data: unknown) => void) => {
        ipcRenderer.on('main-message', (_event, eventName, data) => {
            callback(eventName, data);
        });
    },
});
