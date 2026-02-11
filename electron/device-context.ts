/**
 * Device context collection for the ATLAS Widget.
 *
 * Reads device identifiers from:
 *   - Windows registry (NinjaOne agent, TeamViewer)
 *   - Node.js OS APIs (hostname, user, network, OS version)
 *
 * On non-Windows platforms (dev mode), returns mock/available data.
 */

import os from 'os';
import { execSync } from 'child_process';

export interface DeviceContext {
    computerName: string;
    loggedInUser: string;
    osVersion: string;
    osPlatform: string;
    ipAddress: string;
    domain: string | null;
    ninjaDeviceId: number | null;
    teamviewerId: string | null;
    teamviewerVersion: string | null;
}

/**
 * Collect all device context available on this machine.
 */
export function collectDeviceContext(): DeviceContext {
    return {
        computerName: os.hostname(),
        loggedInUser: os.userInfo().username,
        osVersion: `${os.type()} ${os.release()}`,
        osPlatform: os.platform(),
        ipAddress: getPrimaryIpAddress(),
        domain: getDomain(),
        ninjaDeviceId: readNinjaDeviceId(),
        teamviewerId: readTeamViewerId(),
        teamviewerVersion: readTeamViewerVersion(),
    };
}

/**
 * Get the primary non-internal IPv4 address.
 */
function getPrimaryIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

/**
 * Get the Windows domain (if joined).
 */
function getDomain(): string | null {
    if (os.platform() !== 'win32') return null;
    try {
        const result = execSync('echo %USERDOMAIN%', { encoding: 'utf-8' }).trim();
        return result !== '%USERDOMAIN%' ? result : null;
    } catch {
        return null;
    }
}

/**
 * Read NinjaOne device ID from the Windows registry.
 * NinjaRMM agent stores its device ID at:
 *   HKLM\SOFTWARE\NinjaRMM LLC\NinjaRMMAgent
 */
function readNinjaDeviceId(): number | null {
    if (os.platform() !== 'win32') return null;
    try {
        const result = execSync(
            'reg query "HKLM\\SOFTWARE\\NinjaRMM LLC\\NinjaRMMAgent" /v DeviceId 2>nul',
            { encoding: 'utf-8' },
        );
        const match = result.match(/DeviceId\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
        if (match) return parseInt(match[1], 16);

        // Try string value format
        const matchStr = result.match(/DeviceId\s+REG_SZ\s+(\d+)/);
        if (matchStr) return parseInt(matchStr[1], 10);

        return null;
    } catch {
        return null;
    }
}

/**
 * Read TeamViewer client ID from registry.
 * TeamViewer stores its ID at:
 *   HKLM\SOFTWARE\TeamViewer (64-bit)
 *   HKLM\SOFTWARE\WOW6432Node\TeamViewer (32-bit on 64-bit OS)
 */
function readTeamViewerId(): string | null {
    if (os.platform() !== 'win32') return null;

    const paths = [
        'HKLM\\SOFTWARE\\TeamViewer',
        'HKLM\\SOFTWARE\\WOW6432Node\\TeamViewer',
    ];

    for (const regPath of paths) {
        try {
            const result = execSync(
                `reg query "${regPath}" /v ClientID 2>nul`,
                { encoding: 'utf-8' },
            );
            const match = result.match(/ClientID\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
            if (match) {
                const id = parseInt(match[1], 16);
                // Format as TeamViewer displays it: "1 234 567 890"
                return id.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            }
        } catch {
            continue;
        }
    }
    return null;
}

/**
 * Read TeamViewer version from registry.
 */
function readTeamViewerVersion(): string | null {
    if (os.platform() !== 'win32') return null;

    const paths = [
        'HKLM\\SOFTWARE\\TeamViewer',
        'HKLM\\SOFTWARE\\WOW6432Node\\TeamViewer',
    ];

    for (const regPath of paths) {
        try {
            const result = execSync(
                `reg query "${regPath}" /v Version 2>nul`,
                { encoding: 'utf-8' },
            );
            const match = result.match(/Version\s+REG_SZ\s+(.+)/);
            if (match) return match[1].trim();
        } catch {
            continue;
        }
    }
    return null;
}
