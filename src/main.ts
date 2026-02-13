/**
 * ATLAS Widget — Renderer v2
 *
 * Handles:
 *   - Multi-view navigation (main, qr, email, diagnose, settings)
 *   - Device context loading from main process
 *   - Email ticket form with validation & submission
 *   - Diagnose wizard step machine
 *   - i18n (English / German auto-detection)
 */

import { detectLocale, getTranslations, type Locale, type Translations } from '../electron/i18n';

// ── Type Declarations ──────────────────────────────────────

declare global {
    interface Window {
        atlasAPI: {
            getDeviceContext: () => Promise<DeviceContext>;
            submitTicket: (data: Record<string, unknown>) => Promise<SubmitResult>;
            getTickets: (email: string) => Promise<GetTicketsResult>;
            resolveEmail: (ninjaDeviceId: number) => Promise<ResolveEmailResult>;
            getConfig: () => Promise<{ apiBaseUrl: string }>;
            getLocale: () => Promise<string>;
            hideWindow: () => void;
            onMessage: (cb: (event: string, data: unknown) => void) => void;
        };
    }
}

interface DeviceContext {
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

interface SubmitResult {
    success: boolean;
    data?: {
        ticket: { id: string };
        enrichment: {
            deviceFound: boolean;
            deviceCount: number;
            endUserFound: boolean;
            enrichedFields: string[];
        };
    };
    error?: string;
}

interface ApiTicket {
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    createdAt: string;
    updatedAt: string;
}

interface GetTicketsResult {
    success: boolean;
    data?: {
        tickets: ApiTicket[];
        total: number;
    };
    error?: string;
}

interface ResolveEmailResult {
    success: boolean;
    email?: string | null;
    error?: string;
}

// ── Sub-categories ─────────────────────────────────────────

function getSubCategories(tr: Translations): Record<string, string[]> {
    return {
        'Login & Access': [tr.subCantLogin, tr.subPasswordExpired, tr.subAccountLocked, tr.subMfa],
        'Email': [tr.subCantSend, tr.subCantReceive, tr.subOutlookCrash, tr.subMissingEmails, tr.subCalendarIssue],
        'Printing': [tr.subPrinterOffline, tr.subPrintQuality, tr.subWrongPrinter, tr.subScannerIssue],
        'Network & Internet': [tr.subNoInternet, tr.subSlowConnection, tr.subVpn, tr.subWifi],
        'Software': [tr.subWontOpen, tr.subCrashing, tr.subNeedInstallation, tr.subRunningSlow, tr.subUpdateNeeded],
        'Hardware': [tr.subMonitor, tr.subKeyboardMouse, tr.subLaptop, tr.subDockingStation, tr.subAudioHeadset],
    };
}

// ── DOM Helpers ────────────────────────────────────────────

const $ = <T extends HTMLElement>(id: string): T =>
    document.getElementById(id) as T;

// ── State ──────────────────────────────────────────────────

type ViewId = 'main' | 'qr' | 'email' | 'email-success' | 'diagnose' | 'settings' | 'tickets';
let currentView: ViewId = 'main';
let deviceContext: DeviceContext | null = null;
let currentLocale: Locale = 'en';
let t: Translations = getTranslations('en');
let diagStep = 1;
let selectedQrCat = '';

// ── Ticket History (API-based) ─────────────────────────────

function getUserEmail(): string {
    return $('user-email').textContent?.trim() || '';
}

async function updateTicketCountBadge() {
    const email = getUserEmail();
    const badge = $('ticket-count-badge');
    if (!email || !email.includes('@')) {
        badge.style.display = 'none';
        return;
    }
    try {
        const result = await window.atlasAPI.getTickets(email);
        if (result.success && result.data) {
            const count = result.data.total;
            if (count > 0) {
                badge.style.display = 'inline-flex';
                badge.textContent = String(count);
            } else {
                badge.style.display = 'none';
            }
        }
    } catch {
        badge.style.display = 'none';
    }
}

/**
 * Resolve the user's email from NinjaOne when domain is unavailable (macOS).
 * Calls the backend to look up which system user owns this device,
 * then updates the user-email DOM element and refreshes the ticket badge.
 */
async function resolveUserEmail(ninjaDeviceId: number) {
    try {
        const result = await window.atlasAPI.resolveEmail(ninjaDeviceId);
        if (result.success && result.email) {
            $('user-email').textContent = result.email;
            // Update main view email display
            const mainEmail = $('main-user-email');
            if (mainEmail) {
                mainEmail.textContent = `✉ ${result.email}`;
            }
            // Update settings view email
            $('set-email').textContent = result.email;
            // Re-fetch ticket count now that we have a valid email
            updateTicketCountBadge();
        }
    } catch (err) {
        console.warn('Failed to resolve email from NinjaOne:', err);
    }
}

// ── View Navigation ────────────────────────────────────────

function showView(id: ViewId) {
    // Hide all views
    document.querySelectorAll<HTMLElement>('.view').forEach((v) => {
        v.classList.remove('active');
    });
    // Show target
    const target = $(`view-${id}`);
    if (target) {
        target.classList.add('active');
        currentView = id;
    }
}

// ── Initialization ─────────────────────────────────────────

async function init() {
    // Detect locale
    try {
        const sysLocale = await window.atlasAPI.getLocale();
        currentLocale = detectLocale(sysLocale);
        t = getTranslations(currentLocale);
        applyTranslations(t);
    } catch (err) {
        console.warn('Locale detection failed, using English:', err);
    }

    // Load device context
    try {
        deviceContext = await window.atlasAPI.getDeviceContext();
        populateAll(deviceContext);
        updateMainStatus('connected', deviceContext.computerName);
    } catch (err) {
        console.error('Failed to load device context:', err);
        updateMainStatus('offline', '—');
    }

    // Resolve email from NinjaOne if domain is not available (macOS)
    if (deviceContext && !deviceContext.domain && deviceContext.ninjaDeviceId) {
        resolveUserEmail(deviceContext.ninjaDeviceId);
    }

    // Check API connectivity
    checkApiConnection();

    // Update ticket count badge
    updateTicketCountBadge();

    // Wire up all event listeners
    wireEvents();
}

// ── Populate device info across views ──────────────────────

function populateAll(ctx: DeviceContext) {
    // Welcome title
    const firstName = ctx.loggedInUser
        ? ctx.loggedInUser.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).split(' ')[0]
        : '';
    const welcomeTitle = $('welcome-title');
    if (welcomeTitle && firstName) {
        welcomeTitle.textContent = currentLocale === 'de'
            ? `Hallo ${firstName}! 👋`
            : `Hello ${firstName}! 👋`;
    }

    // Main footer
    $('main-status-device').textContent = ctx.computerName;

    // QR view
    $('qr-device').textContent = ctx.computerName;
    $('qr-ninja').textContent = ctx.ninjaDeviceId ? String(ctx.ninjaDeviceId) : '—';
    $('qr-tv').textContent = ctx.teamviewerId || '—';

    // Email form — user card
    const userInitials = firstName ? firstName.charAt(0).toUpperCase() : '?';
    $('user-avatar').textContent = userInitials;
    const fullName = ctx.loggedInUser
        ? ctx.loggedInUser.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : '—';
    $('user-name').textContent = fullName;

    // Set email: if domain is available, construct it locally.
    // Otherwise, set placeholder — resolveUserEmail() will update it from NinjaOne.
    if (ctx.domain) {
        $('user-email').textContent = `${ctx.loggedInUser}@${ctx.domain}`;
    } else {
        $('user-email').textContent = ctx.loggedInUser || '—';
    }

    // Main view — show email under welcome
    const mainEmail = $('main-user-email');
    if (mainEmail) {
        mainEmail.textContent = getUserEmail().includes('@')
            ? `✉ ${getUserEmail()}`
            : '';
    }

    // Email form — device compact
    $('email-device').textContent = ctx.computerName;
    $('email-ninja').textContent = ctx.ninjaDeviceId ? String(ctx.ninjaDeviceId) : '—';
    $('email-tv').textContent = ctx.teamviewerId || '—';
    $('email-ip').textContent = ctx.ipAddress;

    // Settings view
    $('set-computer').textContent = ctx.computerName;
    $('set-user').textContent = ctx.loggedInUser;
    $('set-email').textContent = getUserEmail().includes('@') ? getUserEmail() : '—';
    $('set-ninja').textContent = ctx.ninjaDeviceId ? String(ctx.ninjaDeviceId) : '—';
    $('set-tv').textContent = ctx.teamviewerId || '—';
    $('set-os').textContent = ctx.osVersion;
    $('set-ip').textContent = ctx.ipAddress;
}

function updateMainStatus(state: 'connected' | 'offline', device: string) {
    const dot = $('main-status-dot');
    const text = $('main-status-text');
    if (state === 'offline') {
        dot.classList.add('offline');
        text.textContent = 'Offline';
    } else {
        dot.classList.remove('offline');
        text.textContent = t.statusConnected || 'Connected';
    }
    $('main-status-device').textContent = device;
}

async function checkApiConnection() {
    try {
        const config = await window.atlasAPI.getConfig();
        const healthUrl = config.apiBaseUrl.replace(/\/api\/?$/, '/health');
        const response = await fetch(healthUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        if (response.status < 500) {
            updateMainStatus('connected', deviceContext?.computerName || '—');
            return;
        }
    } catch { /* ignore */ }

    if (deviceContext) {
        updateMainStatus('connected', deviceContext.computerName);
    } else {
        updateMainStatus('offline', '—');
    }
}

// ── Wire Events ────────────────────────────────────────────

function wireEvents() {
    // ─── Close buttons (all views) ───
    const closeIds = ['btn-close', 'qr-close', 'email-close', 'email-success-close', 'diagnose-close', 'settings-close', 'tickets-close'];
    closeIds.forEach((id) => {
        const el = document.getElementById(id);
        el?.addEventListener('click', () => window.atlasAPI.hideWindow());
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (currentView === 'main') {
                window.atlasAPI.hideWindow();
            } else {
                showView('main');
            }
        }
    });

    // ─── Main → Sub-views ───
    $('action-whatsapp').addEventListener('click', () => showView('qr'));
    $('action-email').addEventListener('click', () => showView('email'));
    $('action-diagnose').addEventListener('click', () => {
        resetDiagnose();
        showView('diagnose');
    });
    $('action-settings').addEventListener('click', () => showView('settings'));
    $('action-tickets').addEventListener('click', () => {
        renderTicketsList();
        showView('tickets');
    });

    // ─── Quick actions (navigate to email with category pre-selected) ───
    document.querySelectorAll<HTMLButtonElement>('.quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            showView('email');
            // Pre-select category mapping
            const cat = btn.dataset.category;
            const categorySelect = $<HTMLSelectElement>('field-category');
            if (cat === 'Printer') categorySelect.value = 'Printing';
            else if (cat === 'Password') categorySelect.value = 'Login & Access';
            else if (cat === 'Internet') categorySelect.value = 'Network & Internet';
            categorySelect.dispatchEvent(new Event('change'));
        });
    });

    // ─── Back buttons ───
    ['qr-back', 'email-back', 'diagnose-back', 'settings-back', 'tickets-back'].forEach((id) => {
        $(id).addEventListener('click', () => showView('main'));
    });

    // ─── QR pills ───
    const qrPills = $('qr-pills');
    qrPills.addEventListener('click', (e) => {
        const pill = (e.target as HTMLElement).closest('.pill') as HTMLElement | null;
        if (!pill) return;

        // Toggle selection
        const wasActive = pill.classList.contains('active');
        qrPills.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));

        if (!wasActive) {
            pill.classList.add('active');
            selectedQrCat = pill.dataset.cat || '';
        } else {
            selectedQrCat = '';
        }

        // Update category line
        const catLine = $('qr-cat-line');
        const catValue = $('qr-cat-value');
        if (selectedQrCat) {
            catLine.style.display = 'block';
            catValue.textContent = selectedQrCat;
        } else {
            catLine.style.display = 'none';
        }
    });

    // ─── QR copy message ───
    $('btn-copy-qr').addEventListener('click', () => {
        const lines = [
            `Device: ${deviceContext?.computerName || '—'}`,
            `Ninja ID: ${deviceContext?.ninjaDeviceId || '—'}`,
            `TeamViewer: ${deviceContext?.teamviewerId || '—'}`,
        ];
        if (selectedQrCat) lines.push(`Category: ${selectedQrCat}`);
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            const span = $('btn-copy-qr').querySelector('span');
            if (span) {
                const orig = span.textContent;
                span.textContent = '✓ Copied!';
                setTimeout(() => { span.textContent = orig; }, 1500);
            }
        });
    });

    // ─── Email form ───
    wireEmailForm();

    // ─── Email success buttons ───
    $('btn-new-ticket').addEventListener('click', () => {
        resetEmailForm();
        showView('email');
    });
    $('btn-back-home').addEventListener('click', () => showView('main'));

    // ─── Diagnose wizard ───
    wireDiagnoseWizard();

    // ─── Settings toggles ───
    document.querySelectorAll<HTMLElement>('.toggle').forEach((toggle) => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });
}

// ── Email Form Logic ───────────────────────────────────────

function wireEmailForm() {
    const categorySelect = $<HTMLSelectElement>('field-category');
    const subcategoryGroup = $('subcategory-group');
    const subcategorySelect = $<HTMLSelectElement>('field-subcategory');
    const btnSubmit = $<HTMLButtonElement>('btn-submit');

    // Category → sub-category
    categorySelect.addEventListener('change', () => {
        const category = categorySelect.value;
        const subCategories = getSubCategories(t);
        const subs = subCategories[category];

        if (subs && subs.length > 0) {
            subcategoryGroup.style.display = 'flex';
            subcategorySelect.innerHTML =
                `<option value="" disabled selected>${t.placeholderSubcategory || 'Select…'}</option>` +
                subs.map((s: string) => `<option value="${s}">${s}</option>`).join('');
        } else {
            subcategoryGroup.style.display = 'none';
            subcategorySelect.value = '';
        }
    });

    // Urgency pills
    document.querySelectorAll<HTMLButtonElement>('.urgency-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.urgency-pill').forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            $<HTMLInputElement>('field-urgency').value = pill.dataset.urgency || 'normal';
        });
    });

    // Submit
    btnSubmit.addEventListener('click', async () => {
        hideToast();
        if (!validateEmailForm()) return;

        setLoading(true);

        const category = categorySelect.value;
        const subcategory = subcategorySelect.value;
        const fullCategory = subcategory ? `${category} > ${subcategory}` : category;
        const urgency = $<HTMLInputElement>('field-urgency').value;
        const summary = $<HTMLInputElement>('field-summary').value.trim();
        const description = $<HTMLTextAreaElement>('field-description').value.trim();

        const ticketData = {
            email: $('user-email').textContent?.trim() || '',
            title: `[${fullCategory}] ${summary}`,
            body: formatTicketBody(description, fullCategory, urgency),
            priority: mapUrgencyToPriority(urgency),
            ninjaDeviceId: deviceContext?.ninjaDeviceId || undefined,
            userName: $('user-name').textContent?.trim() || '',
            computerName: deviceContext?.computerName || undefined,
            teamviewerId: deviceContext?.teamviewerId || undefined,
            widgetContext: {
                category: fullCategory,
                urgency,
                submittedVia: 'atlas-widget-electron',
                widgetVersion: '1.0.0',
                osVersion: deviceContext?.osVersion,
                ipAddress: deviceContext?.ipAddress,
                domain: deviceContext?.domain,
                teamviewerVersion: deviceContext?.teamviewerVersion,
            },
        };

        try {
            const result = await window.atlasAPI.submitTicket(ticketData);
            if (result.success && result.data) {
                const ticketId = result.data.ticket.id;
                const refCode = `ATLAS-${ticketId.substring(0, 8).toUpperCase()}`;
                $('success-ref').textContent = `Reference: ${refCode}`;

                // Refresh ticket count badge (async, non-blocking)
                updateTicketCountBadge();

                showView('email-success');
            } else {
                showToast(result.error || t.toastSubmitFailed || 'Submission failed');
            }
        } catch (err) {
            console.error('Submit error:', err);
            showToast(t.toastConnectionError || 'Connection error');
        } finally {
            setLoading(false);
        }
    });
}

function validateEmailForm(): boolean {
    const categorySelect = $<HTMLSelectElement>('field-category');
    const summary = $<HTMLInputElement>('field-summary');
    const description = $<HTMLTextAreaElement>('field-description');

    let valid = true;
    [categorySelect, summary, description].forEach((el) => el.classList.remove('error'));

    if (!categorySelect.value) { categorySelect.classList.add('error'); valid = false; }
    if (!summary.value.trim()) { summary.classList.add('error'); valid = false; }
    if (!description.value.trim()) { description.classList.add('error'); valid = false; }

    if (!valid) {
        showToast(t.toastFillFields || 'Please fill in all required fields');
        const firstError = document.querySelector('.error') as HTMLElement;
        firstError?.focus();
    }
    return valid;
}

function resetEmailForm() {
    const form = $<HTMLFormElement>('ticket-form');
    form.reset();
    $('subcategory-group').style.display = 'none';
    // Reset urgency to normal
    document.querySelectorAll('.urgency-pill').forEach((p) => p.classList.remove('active'));
    document.querySelector('.urgency-pill[data-urgency="normal"]')?.classList.add('active');
    $<HTMLInputElement>('field-urgency').value = 'normal';
}

// ── Tickets List Rendering ─────────────────────────────────

async function renderTicketsList() {
    const emptyState = $('tickets-empty');
    const listScroll = $('tickets-list-scroll');
    const listContainer = $('tickets-list');
    const footer = $('tickets-footer');

    const email = getUserEmail();
    if (!email || !email.includes('@')) {
        emptyState.style.display = 'flex';
        listScroll.style.display = 'none';
        footer.style.display = 'none';
        return;
    }

    // Show loading state
    listScroll.style.display = 'block';
    emptyState.style.display = 'none';
    footer.style.display = 'none';
    listContainer.innerHTML = `
        <div class="tickets-loading">
            <span class="spinner"></span>
            <span>${t.ticketLoading || 'Loading tickets…'}</span>
        </div>
    `;

    try {
        const result = await window.atlasAPI.getTickets(email);

        if (!result.success || !result.data || result.data.tickets.length === 0) {
            emptyState.style.display = 'flex';
            listScroll.style.display = 'none';
            footer.style.display = 'none';
            return;
        }

        const tickets = result.data.tickets;

        listContainer.innerHTML = tickets.map((ticket: ApiTicket) => {
            const statusClass = mapStatusClass(ticket.status);
            const statusLabel = mapStatusLabel(ticket.status);
            const timeAgo = formatTimeAgo(ticket.createdAt);
            const refCode = `ATLAS-${ticket.id.substring(0, 8).toUpperCase()}`;

            return `
                <div class="ticket-card" data-ticket-id="${ticket.id}">
                    <div class="ticket-card-header">
                        <span class="ticket-card-title" title="${escapeHtml(ticket.title)}">${escapeHtml(ticket.title)}</span>
                        <span class="ticket-status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="ticket-card-meta">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        <span>${escapeHtml(ticket.category || '—')}</span>
                        <span class="ticket-meta-sep">·</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="ticket-card-detail">
                        <div class="ticket-detail-row">
                            <span>${t.ticketReference || 'Reference'}</span>
                            <span>${refCode}</span>
                        </div>
                        <div class="ticket-detail-row">
                            <span>${t.urgency || 'Urgency'}</span>
                            <span>${ticket.priority.toUpperCase()}</span>
                        </div>
                        <div class="ticket-detail-row">
                            <span>${t.ticketCreatedAt || 'Created'}</span>
                            <span>${formatDate(ticket.createdAt)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Wire expand/collapse on ticket cards
        listContainer.querySelectorAll<HTMLElement>('.ticket-card').forEach((card) => {
            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });
        });
    } catch (err) {
        console.error('Failed to fetch tickets:', err);
        emptyState.style.display = 'flex';
        listScroll.style.display = 'none';
        footer.style.display = 'none';
    }
}

function mapStatusClass(status: string): string {
    switch (status) {
        case 'new':
        case 'processing':
            return 'status-open';
        case 'in_progress':
            return 'status-in-progress';
        case 'resolved':
        case 'closed':
            return 'status-resolved';
        default:
            return 'status-open';
    }
}

function mapStatusLabel(status: string): string {
    switch (status) {
        case 'new':
        case 'processing':
            return t.ticketStatusOpen || 'Open';
        case 'in_progress':
            return t.ticketStatusInProgress || 'In Progress';
        case 'resolved':
        case 'closed':
            return t.ticketStatusResolved || 'Resolved';
        default:
            return t.ticketStatusOpen || 'Open';
    }
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimeAgo(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.ticketJustNow || 'Just now';
    if (diffMins < 60) return `${diffMins}m ${t.ticketAgo || 'ago'}`;
    if (diffHours < 24) return `${diffHours}h ${t.ticketAgo || 'ago'}`;
    if (diffDays < 7) return `${diffDays}d ${t.ticketAgo || 'ago'}`;
    return formatDate(isoDate);
}

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString(currentLocale === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// ── Diagnose Wizard ────────────────────────────────────────

function wireDiagnoseWizard() {
    // Step 1: Category selection → go to step 2
    document.querySelectorAll<HTMLButtonElement>('.diag-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            goToDiagStep(2);
        });
    });

    // Step 2: Continue → step 3
    $('diag-next-2').addEventListener('click', () => goToDiagStep(3));

    // Step 3: Auto-fix → step 4
    $('diag-autofix').addEventListener('click', () => goToDiagStep(4));

    // Step 3: Talk to support → go to email view
    $('diag-talk-support').addEventListener('click', () => showView('email'));

    // Step 4: Done → back to main
    $('diag-done').addEventListener('click', () => showView('main'));

    // Step 4: Problem persists → go to email
    $('diag-still-broken').addEventListener('click', () => showView('email'));
}

function goToDiagStep(step: number) {
    diagStep = step;
    // Update step counter
    $('diag-step-num').textContent = String(step);
    // Update progress bar
    $('diag-progress').style.width = `${(step / 4) * 100}%`;
    // Show/hide steps
    document.querySelectorAll<HTMLElement>('.diag-step').forEach((s) => s.classList.remove('active'));
    const target = $(`diag-step-${step}`);
    if (target) target.classList.add('active');
}

function resetDiagnose() {
    diagStep = 1;
    goToDiagStep(1);
}

// ── Helpers ────────────────────────────────────────────────

function formatTicketBody(description: string, category: string, urgency: string): string {
    return [
        description,
        '',
        '───────────────────────────────',
        `Category: ${category}`,
        `Urgency: ${urgency.toUpperCase()}`,
        '',
        'Device Information:',
        `  Computer: ${deviceContext?.computerName || '—'}`,
        `  User: ${deviceContext?.loggedInUser || '—'}`,
        `  OS: ${deviceContext?.osVersion || '—'}`,
        `  IP: ${deviceContext?.ipAddress || '—'}`,
        `  Ninja ID: ${deviceContext?.ninjaDeviceId ?? '—'}`,
        `  TeamViewer: ${deviceContext?.teamviewerId ?? '—'}`,
        `  Domain: ${deviceContext?.domain ?? 'N/A'}`,
        '───────────────────────────────',
        'Submitted via ATLAS Widget v1.0.0',
    ].join('\n');
}

function mapUrgencyToPriority(urgency: string): string {
    switch (urgency) {
        case 'low': return 'low';
        case 'normal': return 'medium';
        case 'high': return 'high';
        case 'critical': return 'urgent';
        default: return 'medium';
    }
}

function setLoading(loading: boolean) {
    const btnSubmit = $<HTMLButtonElement>('btn-submit');
    const btnText = btnSubmit.querySelector('.btn-text') as HTMLElement;
    const btnLoader = btnSubmit.querySelector('.btn-loader') as HTMLElement;
    btnSubmit.disabled = loading;
    btnText.style.display = loading ? 'none' : 'flex';
    btnLoader.style.display = loading ? 'flex' : 'none';
}

function showToast(message: string) {
    const toastError = $('toast-error');
    const toastMessage = $('toast-message');
    toastMessage.textContent = message;
    toastError.style.display = 'flex';
    setTimeout(hideToast, 5000);
}

function hideToast() {
    $('toast-error').style.display = 'none';
}

// ── i18n ───────────────────────────────────────────────────

function applyTranslations(tr: Translations) {
    document.documentElement.lang = currentLocale;

    // data-i18n → textContent
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n as keyof Translations;
        if (tr[key]) el.textContent = tr[key] as string;
    });

    // data-i18n-placeholder
    document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
        const key = el.dataset.i18nPlaceholder as keyof Translations;
        if (tr[key]) (el as HTMLInputElement | HTMLTextAreaElement).placeholder = tr[key] as string;
    });

    // data-i18n-title
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
        const key = el.dataset.i18nTitle as keyof Translations;
        if (tr[key]) el.title = tr[key] as string;
    });
}

// ── Boot ───────────────────────────────────────────────────
init();

export {};
