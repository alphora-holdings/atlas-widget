/**
 * ATLAS Widget — Internationalization (EN / DE)
 *
 * Auto-detects system language and applies translations.
 * Falls back to English for unsupported locales.
 */

export type Locale = 'en' | 'de';

export interface Translations {
    // Tabs
    tabSupport: string;
    tabDevice: string;

    // Welcome
    welcomeHeading: string;
    welcomeSub: string;

    // Form labels
    labelName: string;
    labelEmail: string;
    labelCategory: string;
    labelSubcategory: string;
    labelSummary: string;
    labelDetails: string;
    labelUrgency: string;

    // Form placeholders
    placeholderName: string;
    placeholderEmail: string;
    placeholderCategory: string;
    placeholderSubcategory: string;
    placeholderSummary: string;
    placeholderDetails: string;

    // Urgency
    urgencyLow: string;
    urgencyNormal: string;
    urgencyHigh: string;
    urgencyCritical: string;

    // Categories
    catLoginAccess: string;
    catEmail: string;
    catPrinting: string;
    catNetwork: string;
    catSoftware: string;
    catHardware: string;
    catOther: string;

    // Sub-categories
    subCantLogin: string;
    subPasswordExpired: string;
    subAccountLocked: string;
    subMfa: string;
    subCantSend: string;
    subCantReceive: string;
    subOutlookCrash: string;
    subMissingEmails: string;
    subCalendarIssue: string;
    subPrinterOffline: string;
    subPrintQuality: string;
    subWrongPrinter: string;
    subScannerIssue: string;
    subNoInternet: string;
    subSlowConnection: string;
    subVpn: string;
    subWifi: string;
    subWontOpen: string;
    subCrashing: string;
    subNeedInstallation: string;
    subRunningSlow: string;
    subUpdateNeeded: string;
    subMonitor: string;
    subKeyboardMouse: string;
    subLaptop: string;
    subDockingStation: string;
    subAudioHeadset: string;

    // Device info (support tab)
    deviceInfoToggle: string;
    deviceComputer: string;
    deviceUser: string;
    deviceOs: string;
    deviceIp: string;
    deviceNinja: string;
    deviceTeamviewer: string;

    // Buttons
    btnSend: string;
    btnSending: string;
    btnSubmitAnother: string;
    btnCopy: string;

    // Success
    successHeading: string;
    successSub: string;

    // Errors
    toastDefault: string;
    toastFillFields: string;
    toastSubmitFailed: string;
    toastConnectionError: string;

    // Status
    statusChecking: string;
    statusConnected: string;
    statusReady: string;
    statusLimited: string;

    // Device Info tab — section titles
    sectionIdentity: string;
    sectionSystem: string;
    sectionNetwork: string;
    sectionRemoteSupport: string;

    // Device Info tab — labels
    diComputerName: string;
    diLoggedInUser: string;
    diDomain: string;
    diSerialNumber: string;
    diManufacturer: string;
    diModel: string;
    diOperatingSystem: string;
    diPlatform: string;
    diArchitecture: string;
    diCpu: string;
    diRam: string;
    diDisk: string;
    diUptime: string;
    diIpAddress: string;
    diMacAddress: string;
    diNinjaDeviceId: string;
    diTeamviewerId: string;
    diTeamviewerVersion: string;

    // Fallback values
    notFound: string;
    notInstalled: string;
    unknown: string;

    // Tray menu (used by main process)
    trayOpen: string;
    trayExit: string;
    trayTooltip: string;

    // Close button title
    closeTitle: string;
}

const en: Translations = {
    tabSupport: 'Support',
    tabDevice: 'Device Info',

    welcomeHeading: 'Need help?',
    welcomeSub: 'Submit a ticket and we\'ll get right on it.',

    labelName: 'Your Name',
    labelEmail: 'Your Email',
    labelCategory: 'Issue Category',
    labelSubcategory: 'Specific Issue',
    labelSummary: 'Issue Summary',
    labelDetails: 'Details',
    labelUrgency: 'Urgency',

    placeholderName: 'John Doe',
    placeholderEmail: 'john@company.com',
    placeholderCategory: 'Select a category…',
    placeholderSubcategory: 'Select…',
    placeholderSummary: 'Brief description of your issue',
    placeholderDetails: 'Please describe what\'s happening, when it started, and what you\'ve tried…',

    urgencyLow: 'Low',
    urgencyNormal: 'Normal',
    urgencyHigh: 'High',
    urgencyCritical: 'Critical',

    catLoginAccess: '🔐  Login & Access',
    catEmail: '📧  Email',
    catPrinting: '🖨️  Printing',
    catNetwork: '🌐  Network & Internet',
    catSoftware: '💻  Software',
    catHardware: '🖥️  Hardware',
    catOther: '❓  Other',

    subCantLogin: "Can't login",
    subPasswordExpired: 'Password expired',
    subAccountLocked: 'Account locked',
    subMfa: 'MFA / 2FA issue',
    subCantSend: "Can't send",
    subCantReceive: "Can't receive",
    subOutlookCrash: 'Outlook crash',
    subMissingEmails: 'Missing emails',
    subCalendarIssue: 'Calendar issue',
    subPrinterOffline: 'Printer offline',
    subPrintQuality: 'Print quality',
    subWrongPrinter: 'Wrong printer',
    subScannerIssue: 'Scanner issue',
    subNoInternet: 'No internet',
    subSlowConnection: 'Slow connection',
    subVpn: 'VPN issues',
    subWifi: 'WiFi problems',
    subWontOpen: "Won't open",
    subCrashing: 'Crashing',
    subNeedInstallation: 'Need installation',
    subRunningSlow: 'Running slow',
    subUpdateNeeded: 'Update needed',
    subMonitor: 'Monitor',
    subKeyboardMouse: 'Keyboard / Mouse',
    subLaptop: 'Laptop',
    subDockingStation: 'Docking station',
    subAudioHeadset: 'Audio / Headset',

    deviceInfoToggle: '📱 Device Information',
    deviceComputer: 'Computer',
    deviceUser: 'User',
    deviceOs: 'OS',
    deviceIp: 'IP Address',
    deviceNinja: 'Ninja ID',
    deviceTeamviewer: 'TeamViewer',

    btnSend: 'Send Ticket',
    btnSending: 'Sending…',
    btnSubmitAnother: 'Submit Another Ticket',
    btnCopy: 'Copy',

    successHeading: 'Ticket Submitted!',
    successSub: 'We\'ve received your request and will get back to you shortly.',

    toastDefault: 'Something went wrong',
    toastFillFields: 'Please fill in all required fields.',
    toastSubmitFailed: 'Failed to submit ticket. Please try again.',
    toastConnectionError: 'Connection error. Please check your internet and try again.',

    statusChecking: 'Checking…',
    statusConnected: 'Connected',
    statusReady: 'Ready',
    statusLimited: 'Limited',

    sectionIdentity: 'Identity',
    sectionSystem: 'System',
    sectionNetwork: 'Network',
    sectionRemoteSupport: 'Remote Support',

    diComputerName: 'Computer Name',
    diLoggedInUser: 'Logged-in User',
    diDomain: 'Domain',
    diSerialNumber: 'Serial Number',
    diManufacturer: 'Manufacturer',
    diModel: 'Model',
    diOperatingSystem: 'Operating System',
    diPlatform: 'Platform',
    diArchitecture: 'Architecture',
    diCpu: 'CPU',
    diRam: 'RAM (Total / Free)',
    diDisk: 'Disk (Total / Free)',
    diUptime: 'Uptime',
    diIpAddress: 'IP Address',
    diMacAddress: 'MAC Address',
    diNinjaDeviceId: 'NinjaOne Device ID',
    diTeamviewerId: 'TeamViewer ID',
    diTeamviewerVersion: 'TeamViewer Version',

    notFound: 'Not found',
    notInstalled: 'Not installed',
    unknown: 'Unknown',

    trayOpen: '📧  Open ATLAS Support',
    trayExit: '❌  Exit',
    trayTooltip: 'ATLAS Support — Click for help',

    closeTitle: 'Close',
};

const de: Translations = {
    tabSupport: 'Support',
    tabDevice: 'Geräteinformationen',

    welcomeHeading: 'Brauchen Sie Hilfe?',
    welcomeSub: 'Erstellen Sie ein Ticket und wir kümmern uns darum.',

    labelName: 'Ihr Name',
    labelEmail: 'Ihre E-Mail',
    labelCategory: 'Problemkategorie',
    labelSubcategory: 'Spezifisches Problem',
    labelSummary: 'Zusammenfassung',
    labelDetails: 'Details',
    labelUrgency: 'Dringlichkeit',

    placeholderName: 'Max Mustermann',
    placeholderEmail: 'max@firma.de',
    placeholderCategory: 'Kategorie auswählen…',
    placeholderSubcategory: 'Auswählen…',
    placeholderSummary: 'Kurze Beschreibung des Problems',
    placeholderDetails: 'Bitte beschreiben Sie, was passiert, wann es begann und was Sie bereits versucht haben…',

    urgencyLow: 'Niedrig',
    urgencyNormal: 'Normal',
    urgencyHigh: 'Hoch',
    urgencyCritical: 'Kritisch',

    catLoginAccess: '🔐  Anmeldung & Zugang',
    catEmail: '📧  E-Mail',
    catPrinting: '🖨️  Drucken',
    catNetwork: '🌐  Netzwerk & Internet',
    catSoftware: '💻  Software',
    catHardware: '🖥️  Hardware',
    catOther: '❓  Sonstiges',

    subCantLogin: 'Anmeldung nicht möglich',
    subPasswordExpired: 'Passwort abgelaufen',
    subAccountLocked: 'Konto gesperrt',
    subMfa: 'MFA / 2FA Problem',
    subCantSend: 'Senden nicht möglich',
    subCantReceive: 'Empfangen nicht möglich',
    subOutlookCrash: 'Outlook-Absturz',
    subMissingEmails: 'Fehlende E-Mails',
    subCalendarIssue: 'Kalenderproblem',
    subPrinterOffline: 'Drucker offline',
    subPrintQuality: 'Druckqualität',
    subWrongPrinter: 'Falscher Drucker',
    subScannerIssue: 'Scanner-Problem',
    subNoInternet: 'Kein Internet',
    subSlowConnection: 'Langsame Verbindung',
    subVpn: 'VPN-Probleme',
    subWifi: 'WLAN-Probleme',
    subWontOpen: 'Öffnet nicht',
    subCrashing: 'Abstürze',
    subNeedInstallation: 'Installation benötigt',
    subRunningSlow: 'Läuft langsam',
    subUpdateNeeded: 'Update erforderlich',
    subMonitor: 'Monitor',
    subKeyboardMouse: 'Tastatur / Maus',
    subLaptop: 'Laptop',
    subDockingStation: 'Dockingstation',
    subAudioHeadset: 'Audio / Headset',

    deviceInfoToggle: '📱 Geräteinformationen',
    deviceComputer: 'Computer',
    deviceUser: 'Benutzer',
    deviceOs: 'Betriebssystem',
    deviceIp: 'IP-Adresse',
    deviceNinja: 'Ninja-ID',
    deviceTeamviewer: 'TeamViewer',

    btnSend: 'Ticket senden',
    btnSending: 'Wird gesendet…',
    btnSubmitAnother: 'Weiteres Ticket erstellen',
    btnCopy: 'Kopieren',

    successHeading: 'Ticket gesendet!',
    successSub: 'Wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.',

    toastDefault: 'Etwas ist schiefgelaufen',
    toastFillFields: 'Bitte füllen Sie alle Pflichtfelder aus.',
    toastSubmitFailed: 'Ticket konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
    toastConnectionError: 'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.',

    statusChecking: 'Prüfe…',
    statusConnected: 'Verbunden',
    statusReady: 'Bereit',
    statusLimited: 'Eingeschränkt',

    sectionIdentity: 'Identität',
    sectionSystem: 'System',
    sectionNetwork: 'Netzwerk',
    sectionRemoteSupport: 'Fernwartung',

    diComputerName: 'Computername',
    diLoggedInUser: 'Angemeldeter Benutzer',
    diDomain: 'Domäne',
    diSerialNumber: 'Seriennummer',
    diManufacturer: 'Hersteller',
    diModel: 'Modell',
    diOperatingSystem: 'Betriebssystem',
    diPlatform: 'Plattform',
    diArchitecture: 'Architektur',
    diCpu: 'CPU',
    diRam: 'RAM (Gesamt / Frei)',
    diDisk: 'Festplatte (Gesamt / Frei)',
    diUptime: 'Betriebszeit',
    diIpAddress: 'IP-Adresse',
    diMacAddress: 'MAC-Adresse',
    diNinjaDeviceId: 'NinjaOne Geräte-ID',
    diTeamviewerId: 'TeamViewer-ID',
    diTeamviewerVersion: 'TeamViewer-Version',

    notFound: 'Nicht gefunden',
    notInstalled: 'Nicht installiert',
    unknown: 'Unbekannt',

    trayOpen: '📧  ATLAS Support öffnen',
    trayExit: '❌  Beenden',
    trayTooltip: 'ATLAS Support — Klicken für Hilfe',

    closeTitle: 'Schließen',
};

const translations: Record<Locale, Translations> = { en, de };

/**
 * Detect the locale from a locale string (e.g. 'de-DE', 'en-US', 'de').
 * Returns 'de' for any German locale, 'en' for everything else.
 */
export function detectLocale(systemLocale: string): Locale {
    const lang = systemLocale.toLowerCase().split(/[-_]/)[0];
    return lang === 'de' ? 'de' : 'en';
}

/**
 * Get the full translations object for a locale.
 */
export function getTranslations(locale: Locale): Translations {
    return translations[locale];
}
