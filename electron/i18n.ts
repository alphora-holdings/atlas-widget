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

    // New v2 UI keys
    welcomeSub2: string;
    actionWhatsapp: string;
    actionWhatsappSub: string;
    actionEmail: string;
    actionEmailSub: string;
    actionDiagnose: string;
    actionDiagnoseSub: string;
    badgeFastest: string;
    badgeNew: string;
    commonIssues: string;
    qaPrinter: string;
    qaPassword: string;
    qaInternet: string;
    qaNetwork: string;
    qaOther: string;
    back: string;
    qrTitle: string;
    qrSub: string;
    qrCatLabel: string;
    qrHint: string;
    qrHintSub: string;
    qrTimer: string;
    qrInfoSent: string;
    qrCopy: string;
    deviceLabel: string;
    categoryLabel: string;
    emailTitle: string;
    emailSub: string;
    category: string;
    selectCategory: string;
    subcategory: string;
    selectSubcategory: string;
    summary: string;
    summaryPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    urgency: string;
    urgLow: string;
    urgNormal: string;
    urgHigh: string;
    urgCritical: string;
    screenshotLabel: string;
    screenshotBtn: string;
    deviceInfo: string;
    autoDetected: string;
    sendTicket: string;
    sending: string;
    ticketSubmitted: string;
    ticketSubmittedSub: string;
    submitAnother: string;
    backToHome: string;
    diagnoseTitle: string;
    step: string;
    of: string;
    diagWhatsWrong: string;
    diagSelectCat: string;
    diagPrinter: string;
    diagInternet: string;
    diagSlow: string;
    diagEmail: string;
    diagLogin: string;
    diagRunning: string;
    diagChecking: string;
    diagConnCheck: string;
    diagQueueCheck: string;
    diagDriverCheck: string;
    continue: string;
    diagProblemFound: string;
    diagIssueId: string;
    diagIssueDetected: string;
    diagRecommended: string;
    diagAutoFix: string;
    diagTalkSupport: string;
    diagFixed: string;
    diagAllGood: string;
    done: string;
    diagStillBroken: string;
    settingsTitle: string;
    connected: string;
    allSystemsOp: string;
    setComputer: string;
    setUser: string;
    setOS: string;
    setIP: string;
    privacy: string;
    shareDevice: string;
    sendErrors: string;
    autoScreenshots: string;
    notifications: string;
    showTips: string;
    ticketUpdates: string;
    supportContact: string;

    // Tray menu (used by main process)
    trayOpen: string;
    trayExit: string;
    trayTooltip: string;

    // Close button title
    closeTitle: string;

    // Tickets History view
    myTickets: string;
    myTicketsTitle: string;
    myTicketsSub: string;
    noTicketsYet: string;
    noTicketsDesc: string;
    createTicket: string;
    submitNewTicket: string;
    ticketStatusOpen: string;
    ticketStatusInProgress: string;
    ticketStatusResolved: string;
    ticketReference: string;
    ticketCreatedAt: string;
    ticketLoading: string;
    ticketJustNow: string;
    ticketAgo: string;
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

    // v2 UI keys
    welcomeSub2: 'How can we help you?',
    actionWhatsapp: 'WhatsApp Support',
    actionWhatsappSub: 'Scan QR code and start chatting',
    actionEmail: 'Email Support',
    actionEmailSub: 'Create a detailed ticket',
    actionDiagnose: 'Self-Diagnose',
    actionDiagnoseSub: 'Fix problems with guided help',
    badgeFastest: 'Fastest',
    badgeNew: 'New',
    commonIssues: 'Common Issues',
    qaPrinter: 'Printer',
    qaPassword: 'Password',
    qaInternet: 'Internet',
    qaNetwork: 'Network',
    qaOther: 'Other',
    back: 'Back',
    qrTitle: 'WhatsApp Support',
    qrSub: 'Scan with your phone',
    qrCatLabel: 'What is it about? (optional)',
    qrHint: 'Point camera at the QR code',
    qrHintSub: 'WhatsApp will open automatically',
    qrTimer: 'Valid for 15 minutes',
    qrInfoSent: 'This info will be sent along:',
    qrCopy: "Can't scan? Copy message",
    deviceLabel: 'Device',
    categoryLabel: 'Category',
    emailTitle: 'Email Support',
    emailSub: "We'll get back to you ASAP",
    category: 'Category',
    selectCategory: 'Select a category…',
    subcategory: 'Specific Issue',
    selectSubcategory: 'Select…',
    summary: 'Summary',
    summaryPlaceholder: 'e.g. Printer is not printing',
    description: 'Description',
    descriptionPlaceholder: 'Please describe the problem in more detail…',
    urgency: 'Urgency',
    urgLow: 'Low',
    urgNormal: 'Normal',
    urgHigh: 'High',
    urgCritical: 'Critical',
    screenshotLabel: 'Screenshot (optional)',
    screenshotBtn: 'Click to take a screenshot',
    deviceInfo: 'Device Information',
    autoDetected: 'Auto-detected',
    sendTicket: 'Send Ticket',
    sending: 'Sending…',
    ticketSubmitted: 'Ticket Submitted!',
    ticketSubmittedSub: "We've received your request and will get back to you shortly.",
    submitAnother: 'Submit Another Ticket',
    backToHome: 'Back to Home',
    diagnoseTitle: 'Self-Diagnose',
    step: 'Step',
    of: 'of',
    diagWhatsWrong: "What's the problem?",
    diagSelectCat: 'Select a category',
    diagPrinter: 'Printer not working',
    diagInternet: 'No Internet',
    diagSlow: 'Computer is slow',
    diagEmail: 'Email problems',
    diagLogin: 'Login failed',
    diagRunning: 'Running Diagnostics',
    diagChecking: 'Checking your system…',
    diagConnCheck: 'Connection check',
    diagQueueCheck: 'Queue check',
    diagDriverCheck: 'Driver status…',
    continue: 'Continue',
    diagProblemFound: 'Problem found!',
    diagIssueId: 'Issue identified',
    diagIssueDetected: 'Issue detected',
    diagRecommended: 'Recommended solution:',
    diagAutoFix: 'Auto-fix',
    diagTalkSupport: 'Talk to support instead',
    diagFixed: 'Problem fixed! ✓',
    diagAllGood: 'Everything should work now',
    done: 'Done',
    diagStillBroken: 'Problem persists',
    settingsTitle: 'Settings',
    connected: 'Connected',
    allSystemsOp: 'All systems operational',
    setComputer: 'Computer Name',
    setUser: 'Logged-in User',
    setOS: 'Operating System',
    setIP: 'IP Address',
    privacy: 'Privacy',
    shareDevice: 'Share device context',
    sendErrors: 'Send error reports',
    autoScreenshots: 'Auto screenshots',
    notifications: 'Notifications',
    showTips: 'Show tips & hints',
    ticketUpdates: 'Ticket updates',
    supportContact: 'Support Contact',

    // Tickets History
    myTickets: 'My Tickets',
    myTicketsTitle: 'My Tickets',
    myTicketsSub: 'Your submitted requests',
    noTicketsYet: 'No tickets yet',
    noTicketsDesc: 'Tickets you submit will appear here so you can track their status.',
    createTicket: 'Create a Ticket',
    submitNewTicket: 'Submit New Ticket',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketReference: 'Reference',
    ticketCreatedAt: 'Created',
    ticketLoading: 'Loading tickets…',
    ticketJustNow: 'Just now',
    ticketAgo: 'ago',
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

    // v2 UI keys
    welcomeSub2: 'Wie können wir Ihnen helfen?',
    actionWhatsapp: 'WhatsApp Support',
    actionWhatsappSub: 'QR-Code scannen und chatten',
    actionEmail: 'E-Mail Support',
    actionEmailSub: 'Erstellen Sie ein detailliertes Ticket',
    actionDiagnose: 'Selbstdiagnose',
    actionDiagnoseSub: 'Probleme mit geführter Hilfe lösen',
    badgeFastest: 'Schnellste',
    badgeNew: 'Neu',
    commonIssues: 'Häufige Probleme',
    qaPrinter: 'Drucker',
    qaPassword: 'Passwort',
    qaInternet: 'Internet',
    qaNetwork: 'Netzwerk',
    qaOther: 'Sonstiges',
    back: 'Zurück',
    qrTitle: 'WhatsApp Support',
    qrSub: 'Mit dem Handy scannen',
    qrCatLabel: 'Worum geht es? (optional)',
    qrHint: 'Kamera auf den QR-Code richten',
    qrHintSub: 'WhatsApp öffnet sich automatisch',
    qrTimer: 'Gültig für 15 Minuten',
    qrInfoSent: 'Diese Informationen werden mitgesendet:',
    qrCopy: 'Kann nicht scannen? Nachricht kopieren',
    deviceLabel: 'Gerät',
    categoryLabel: 'Kategorie',
    emailTitle: 'E-Mail Support',
    emailSub: 'Wir melden uns schnellstmöglich',
    category: 'Kategorie',
    selectCategory: 'Kategorie auswählen…',
    subcategory: 'Spezifisches Problem',
    selectSubcategory: 'Auswählen…',
    summary: 'Zusammenfassung',
    summaryPlaceholder: 'z.B. Drucker druckt nicht',
    description: 'Beschreibung',
    descriptionPlaceholder: 'Bitte beschreiben Sie das Problem genauer…',
    urgency: 'Dringlichkeit',
    urgLow: 'Niedrig',
    urgNormal: 'Normal',
    urgHigh: 'Hoch',
    urgCritical: 'Kritisch',
    screenshotLabel: 'Screenshot (optional)',
    screenshotBtn: 'Klicken für Screenshot',
    deviceInfo: 'Geräteinformationen',
    autoDetected: 'Automatisch erkannt',
    sendTicket: 'Ticket absenden',
    sending: 'Wird gesendet…',
    ticketSubmitted: 'Ticket gesendet!',
    ticketSubmittedSub: 'Wir haben Ihre Anfrage erhalten und melden uns in Kürze.',
    submitAnother: 'Weiteres Ticket erstellen',
    backToHome: 'Zurück zur Startseite',
    diagnoseTitle: 'Selbstdiagnose',
    step: 'Schritt',
    of: 'von',
    diagWhatsWrong: 'Was ist das Problem?',
    diagSelectCat: 'Kategorie auswählen',
    diagPrinter: 'Drucker funktioniert nicht',
    diagInternet: 'Kein Internet',
    diagSlow: 'Computer ist langsam',
    diagEmail: 'E-Mail-Probleme',
    diagLogin: 'Anmeldung fehlgeschlagen',
    diagRunning: 'Diagnose läuft',
    diagChecking: 'System wird überprüft…',
    diagConnCheck: 'Verbindungsprüfung',
    diagQueueCheck: 'Warteschlangenprüfung',
    diagDriverCheck: 'Treiberstatus…',
    continue: 'Weiter',
    diagProblemFound: 'Problem gefunden!',
    diagIssueId: 'Problem identifiziert',
    diagIssueDetected: 'Problem erkannt',
    diagRecommended: 'Empfohlene Lösung:',
    diagAutoFix: 'Automatisch beheben',
    diagTalkSupport: 'Lieber mit Support sprechen',
    diagFixed: 'Problem behoben! ✓',
    diagAllGood: 'Alles sollte jetzt funktionieren',
    done: 'Fertig',
    diagStillBroken: 'Problem besteht weiterhin',
    settingsTitle: 'Einstellungen',
    connected: 'Verbunden',
    allSystemsOp: 'Alle Systeme funktionsfähig',
    setComputer: 'Computername',
    setUser: 'Angemeldeter Benutzer',
    setOS: 'Betriebssystem',
    setIP: 'IP-Adresse',
    privacy: 'Datenschutz',
    shareDevice: 'Gerätekontext teilen',
    sendErrors: 'Fehlerberichte senden',
    autoScreenshots: 'Automatische Screenshots',
    notifications: 'Benachrichtigungen',
    showTips: 'Tipps & Hinweise anzeigen',
    ticketUpdates: 'Ticket-Updates',
    supportContact: 'Support-Kontakt',

    // Tickets History
    myTickets: 'Meine Tickets',
    myTicketsTitle: 'Meine Tickets',
    myTicketsSub: 'Ihre eingereichten Anfragen',
    noTicketsYet: 'Noch keine Tickets',
    noTicketsDesc: 'Eingereichte Tickets werden hier angezeigt, damit Sie den Status verfolgen können.',
    createTicket: 'Ticket erstellen',
    submitNewTicket: 'Neues Ticket erstellen',
    ticketStatusOpen: 'Offen',
    ticketStatusInProgress: 'In Bearbeitung',
    ticketStatusResolved: 'Gelöst',
    ticketReference: 'Referenz',
    ticketCreatedAt: 'Erstellt',
    ticketLoading: 'Tickets werden geladen…',
    ticketJustNow: 'Gerade eben',
    ticketAgo: 'her',
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
