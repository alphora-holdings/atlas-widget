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
    macAddress: string | null;
    domain: string | null;
    cpu: string;
    arch: string;
    totalMemoryGB: string;
    freeMemoryGB: string;
    diskTotal: string | null;
    diskFree: string | null;
    serialNumber: string | null;
    manufacturer: string | null;
    model: string | null;
    uptimeFormatted: string;
    ninjaDeviceId: number | null;
    teamviewerId: string | null;
    teamviewerVersion: string | null;
}

/**
 * Collect all device context available on this machine.
 */
export function collectDeviceContext(): DeviceContext {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptimeSec = os.uptime();

    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const uptimeFormatted = days > 0
        ? `${days}d ${hours}h ${mins}m`
        : `${hours}h ${mins}m`;

    const diskInfo = getDiskInfo();
    const hwInfo = getHardwareInfo();

    return {
        computerName: os.hostname(),
        loggedInUser: os.userInfo().username,
        osVersion: getOsVersionFriendly(),
        osPlatform: os.platform(),
        ipAddress: getPrimaryIpAddress(),
        macAddress: getPrimaryMacAddress(),
        domain: getDomain(),
        cpu: cpus.length > 0 ? cpus[0].model.trim() : 'Unknown',
        arch: os.arch(),
        totalMemoryGB: (totalMem / 1073741824).toFixed(1),
        freeMemoryGB: (freeMem / 1073741824).toFixed(1),
        diskTotal: diskInfo.total,
        diskFree: diskInfo.free,
        serialNumber: hwInfo.serialNumber,
        manufacturer: hwInfo.manufacturer,
        model: hwInfo.model,
        uptimeFormatted,
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
 * Get the MAC address of the primary network interface.
 */
function getPrimaryMacAddress(): string | null {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
            if (iface.family === 'IPv4' && !iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                return iface.mac.toUpperCase();
            }
        }
    }
    return null;
}

/**
 * Get a user-friendly OS version string.
 */
function getOsVersionFriendly(): string {
    const platform = os.platform();
    const release = os.release();

    if (platform === 'darwin') {
        // macOS: os.release() returns Darwin kernel version, e.g. "23.1.0"
        // Map to macOS version
        try {
            const result = execSync('sw_vers -productVersion', { encoding: 'utf-8' }).trim();
            return `macOS ${result}`;
        } catch {
            return `macOS (${release})`;
        }
    } else if (platform === 'win32') {
        return `Windows ${release}`;
    }
    return `${os.type()} ${release}`;
}

/**
 * Get disk usage for the primary disk.
 */
function getDiskInfo(): { total: string | null; free: string | null } {
    try {
        if (os.platform() === 'win32') {
            const result = execSync(
                'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv',
                { encoding: 'utf-8' },
            );
            const lines = result.trim().split('\n').filter(l => l.trim());
            const last = lines[lines.length - 1];
            const parts = last.split(',');
            // CSV: Node,FreeSpace,Size
            if (parts.length >= 3) {
                const free = parseInt(parts[1]);
                const total = parseInt(parts[2]);
                if (!isNaN(free) && !isNaN(total)) {
                    return {
                        total: (total / 1073741824).toFixed(0) + ' GB',
                        free: (free / 1073741824).toFixed(0) + ' GB',
                    };
                }
            }
        } else {
            const result = execSync("df -k / | tail -1", { encoding: 'utf-8' });
            const parts = result.trim().split(/\s+/);
            // df -k output: Filesystem 1K-blocks Used Available Use% Mounted
            if (parts.length >= 4) {
                const total = parseInt(parts[1]) * 1024;
                const free = parseInt(parts[3]) * 1024;
                if (!isNaN(total) && !isNaN(free)) {
                    return {
                        total: (total / 1073741824).toFixed(0) + ' GB',
                        free: (free / 1073741824).toFixed(0) + ' GB',
                    };
                }
            }
        }
    } catch { /* ignore */ }
    return { total: null, free: null };
}

/**
 * Get hardware info (serial, manufacturer, model).
 */
function getHardwareInfo(): { serialNumber: string | null; manufacturer: string | null; model: string | null } {
    const result = { serialNumber: null as string | null, manufacturer: null as string | null, model: null as string | null };

    try {
        if (os.platform() === 'win32') {
            const serial = execSync('wmic bios get serialnumber /format:csv', { encoding: 'utf-8' });
            const serialLines = serial.trim().split('\n').filter(l => l.trim());
            const serialLast = serialLines[serialLines.length - 1].split(',');
            if (serialLast.length >= 2) result.serialNumber = serialLast[1].trim() || null;

            const product = execSync('wmic csproduct get name,vendor /format:csv', { encoding: 'utf-8' });
            const prodLines = product.trim().split('\n').filter(l => l.trim());
            const prodLast = prodLines[prodLines.length - 1].split(',');
            // CSV: Node,Name,Vendor
            if (prodLast.length >= 3) {
                result.model = prodLast[1].trim() || null;
                result.manufacturer = prodLast[2].trim() || null;
            }
        } else if (os.platform() === 'darwin') {
            const profiler = execSync('system_profiler SPHardwareDataType', { encoding: 'utf-8' });

            const serialMatch = profiler.match(/Serial Number.*?:\s*(.+)/i);
            if (serialMatch) result.serialNumber = serialMatch[1].trim();

            const modelMatch = profiler.match(/Model Name:\s*(.+)/i);
            if (modelMatch) result.model = modelMatch[1].trim();

            const mfgMatch = profiler.match(/Chip:\s*(.+)/i);
            if (mfgMatch) result.manufacturer = `Apple ${mfgMatch[1].trim()}`;
            else result.manufacturer = 'Apple';
        }
    } catch { /* ignore */ }

    return result;
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
 * Read NinjaOne device ID from the registry (Windows) or agent config (macOS).
 */
function readNinjaDeviceId(): number | null {
    if (os.platform() === 'win32') {
        try {
            const result = execSync(
                'reg query "HKLM\\SOFTWARE\\NinjaRMM LLC\\NinjaRMMAgent" /v DeviceId 2>nul',
                { encoding: 'utf-8' },
            );
            const match = result.match(/DeviceId\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
            if (match) return parseInt(match[1], 16);

            const matchStr = result.match(/DeviceId\s+REG_SZ\s+(\d+)/);
            if (matchStr) return parseInt(matchStr[1], 10);
        } catch { /* ignore */ }
    } else if (os.platform() === 'darwin') {
        // NinjaOne macOS agent stores config in various locations
        const configPaths = [
            '/Applications/NinjaRMMAgent/programdata/ninjarmm-macagent.conf',
            '/opt/NinjaRMMAgent/programdata/ninjarmm-macagent.conf',
        ];
        for (const cfgPath of configPaths) {
            try {
                const content = require('fs').readFileSync(cfgPath, 'utf-8');
                const match = content.match(/"device_id"\s*:\s*(\d+)/);
                if (match) return parseInt(match[1], 10);
            } catch { continue; }
        }
    }
    return null;
}

/**
 * Read TeamViewer client ID from registry (Windows) or config (macOS).
 */
function readTeamViewerId(): string | null {
    if (os.platform() === 'win32') {
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
                    return id.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                }
            } catch { continue; }
        }
    } else if (os.platform() === 'darwin') {
        // TeamViewer on macOS stores config in plist or global.conf
        const tvPaths = [
            '/Library/Preferences/com.teamviewer.teamviewer.preferences.plist',
            '/Library/Preferences/com.teamviewer.teamviewer10.plist',
        ];
        for (const tvPath of tvPaths) {
            try {
                const result = execSync(
                    `defaults read "${tvPath}" ClientID 2>/dev/null`,
                    { encoding: 'utf-8' },
                );
                const id = result.trim();
                if (id && /^\d+$/.test(id)) {
                    return id.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                }
            } catch { continue; }
        }
        // Fallback: try reading from global.conf
        try {
            const conf = require('fs').readFileSync('/opt/teamviewer/config/global.conf', 'utf-8');
            const match = conf.match(/\[int32\]\s*ClientID\s*=\s*(\d+)/);
            if (match) return match[1].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        } catch { /* ignore */ }
    }
    return null;
}

/**
 * Read TeamViewer version from registry (Windows) or app bundle (macOS).
 */
function readTeamViewerVersion(): string | null {
    if (os.platform() === 'win32') {
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
            } catch { continue; }
        }
    } else if (os.platform() === 'darwin') {
        try {
            const result = execSync(
                'defaults read /Applications/TeamViewer.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null',
                { encoding: 'utf-8' },
            );
            if (result.trim()) return result.trim();
        } catch { /* ignore */ }
    }
    return null;
}
