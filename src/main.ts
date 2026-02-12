/**
 * ATLAS Widget — Renderer (Form Logic & API)
 *
 * Handles:
 *   - Loading device context from the main process
 *   - Category/sub-category selection
 *   - Form validation and submission
 *   - API call via IPC to main process
 *   - Success/error states
 */

// ── Type Declarations ──────────────────────────────────────

declare global {
    interface Window {
        atlasAPI: {
            getDeviceContext: () => Promise<DeviceContext>;
            submitTicket: (data: Record<string, unknown>) => Promise<SubmitResult>;
            getConfig: () => Promise<{ apiBaseUrl: string }>;
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

// ── Sub-categories ─────────────────────────────────────────

const SUB_CATEGORIES: Record<string, string[]> = {
    'Login & Access': ["Can't login", 'Password expired', 'Account locked', 'MFA / 2FA issue'],
    'Email': ["Can't send", "Can't receive", 'Outlook crash', 'Missing emails', 'Calendar issue'],
    'Printing': ['Printer offline', 'Print quality', 'Wrong printer', 'Scanner issue'],
    'Network & Internet': ['No internet', 'Slow connection', 'VPN issues', 'WiFi problems'],
    'Software': ["Won't open", 'Crashing', 'Need installation', 'Running slow', 'Update needed'],
    'Hardware': ['Monitor', 'Keyboard / Mouse', 'Laptop', 'Docking station', 'Audio / Headset'],
};

// ── DOM Elements ───────────────────────────────────────────

const $ = <T extends HTMLElement>(id: string): T =>
    document.getElementById(id) as T;

const form = $<HTMLFormElement>('ticket-form');
const btnClose = $<HTMLButtonElement>('btn-close');
const btnSubmit = $<HTMLButtonElement>('btn-submit');
const btnNewTicket = $<HTMLButtonElement>('btn-new-ticket');
const viewForm = $<HTMLElement>('view-form');
const viewSuccess = $<HTMLElement>('view-success');
const successRef = $<HTMLElement>('success-ref');
const toastError = $<HTMLElement>('toast-error');
const toastMessage = $<HTMLElement>('toast-message');
const deviceToggle = $<HTMLButtonElement>('device-toggle');
const deviceDetails = $<HTMLElement>('device-details');
const categorySelect = $<HTMLSelectElement>('field-category');
const subcategoryGroup = $<HTMLElement>('subcategory-group');
const subcategorySelect = $<HTMLSelectElement>('field-subcategory');
const statusDot = $<HTMLElement>('status-dot');
const statusText = $<HTMLElement>('status-text');
const statusDevice = $<HTMLElement>('status-device');

// Tab elements
const tabBar = $<HTMLElement>('tab-bar');
const viewDevice = $<HTMLElement>('view-device');

// State
let deviceContext: DeviceContext | null = null;

// ── Initialization ─────────────────────────────────────────

async function init() {
    // Load device context
    try {
        deviceContext = await window.atlasAPI.getDeviceContext();
        populateDeviceInfo(deviceContext);
        populateDeviceTab(deviceContext);
        prefillUserFields(deviceContext);
        updateStatus('connected', 'Connected', deviceContext.computerName);
    } catch (err) {
        console.error('Failed to load device context:', err);
        updateStatus('limited', 'Limited', '—');
    }

    // Check API connectivity
    checkApiConnection();
}

function populateDeviceInfo(ctx: DeviceContext) {
    $('ctx-computer').textContent = ctx.computerName;
    $('ctx-user').textContent = ctx.loggedInUser;
    $('ctx-os').textContent = ctx.osVersion;
    $('ctx-ip').textContent = ctx.ipAddress;
    $('ctx-ninja').textContent = ctx.ninjaDeviceId
        ? String(ctx.ninjaDeviceId)
        : 'Not found';
    $('ctx-tv').textContent = ctx.teamviewerId || 'Not installed';
}

function populateDeviceTab(ctx: DeviceContext) {
    // Identity
    $('di-computer').textContent = ctx.computerName;
    $('di-user').textContent = ctx.loggedInUser;
    $('di-domain').textContent = ctx.domain || 'N/A';
    $('di-serial').textContent = ctx.serialNumber || 'Unknown';
    $('di-manufacturer').textContent = ctx.manufacturer || 'Unknown';
    $('di-model').textContent = ctx.model || 'Unknown';

    // System
    $('di-os').textContent = ctx.osVersion;
    $('di-platform').textContent = ctx.osPlatform;
    $('di-arch').textContent = ctx.arch;
    $('di-cpu').textContent = ctx.cpu;
    $('di-ram').textContent = `${ctx.totalMemoryGB} GB / ${ctx.freeMemoryGB} GB free`;
    $('di-disk').textContent =
        ctx.diskTotal && ctx.diskFree
            ? `${ctx.diskTotal} / ${ctx.diskFree} free`
            : 'Unknown';
    $('di-uptime').textContent = ctx.uptimeFormatted;

    // Network
    $('di-ip').textContent = ctx.ipAddress;
    $('di-mac').textContent = ctx.macAddress || 'Unknown';

    // Remote Support
    $('di-ninja').textContent = ctx.ninjaDeviceId
        ? String(ctx.ninjaDeviceId)
        : 'Not found';
    $('di-tvid').textContent = ctx.teamviewerId || 'Not installed';
    $('di-tvver').textContent = ctx.teamviewerVersion || 'N/A';
}

function prefillUserFields(ctx: DeviceContext) {
    const nameField = $<HTMLInputElement>('field-name');
    const emailField = $<HTMLInputElement>('field-email');

    // Pre-fill user name from logged-in user (capitalize)
    if (ctx.loggedInUser) {
        const formatted = ctx.loggedInUser
            .replace(/\./g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
        nameField.value = formatted;
    }
}

async function checkApiConnection() {
    try {
        const config = await window.atlasAPI.getConfig();
        const response = await fetch(`${config.apiBaseUrl.replace('/api', '')}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
            updateStatus('connected', 'Connected', deviceContext?.computerName || '—');
        } else {
            updateStatus('limited', 'Limited', deviceContext?.computerName || '—');
        }
    } catch {
        updateStatus('offline', 'Offline', deviceContext?.computerName || '—');
    }
}

function updateStatus(state: string, text: string, device: string) {
    statusDot.className = `status-dot ${state}`;
    statusText.textContent = text;
    statusDevice.textContent = device;
}

// ── Event Listeners ────────────────────────────────────────

// Close button
btnClose.addEventListener('click', () => {
    window.atlasAPI.hideWindow();
});

// Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.atlasAPI.hideWindow();
    }
});

// Device info toggle
deviceToggle.addEventListener('click', () => {
    const isOpen = deviceDetails.style.display !== 'none';
    deviceDetails.style.display = isOpen ? 'none' : 'block';
    deviceToggle.classList.toggle('open', !isOpen);
});

// Tab switching
tabBar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.tab-btn') as HTMLElement | null;
    if (!btn) return;
    const tab = btn.dataset.tab;

    // Update active tab button
    tabBar.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Show/hide views
    if (tab === 'support') {
        viewForm.style.display = 'block';
        viewDevice.style.display = 'none';
        viewSuccess.style.display = 'none';
    } else if (tab === 'device') {
        viewForm.style.display = 'none';
        viewDevice.style.display = 'block';
        viewSuccess.style.display = 'none';
    }
});

// Category → Sub-category
categorySelect.addEventListener('change', () => {
    const category = categorySelect.value;
    const subs = SUB_CATEGORIES[category];

    if (subs && subs.length > 0) {
        subcategoryGroup.style.display = 'flex';
        subcategorySelect.innerHTML =
            '<option value="" disabled selected>Select…</option>' +
            subs.map((s) => `<option value="${s}">${s}</option>`).join('');
    } else {
        subcategoryGroup.style.display = 'none';
        subcategorySelect.value = '';
    }
});

// "Submit Another" button
btnNewTicket.addEventListener('click', () => {
    resetForm();
    viewSuccess.style.display = 'none';
    viewForm.style.display = 'block';
    viewDevice.style.display = 'none';
    // Reset tab to Support
    tabBar.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    tabBar.querySelector('[data-tab="support"]')?.classList.add('active');
});

// ── Form Submission ────────────────────────────────────────

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideToast();

    // Validate
    if (!validateForm()) return;

    // Show loading
    setLoading(true);

    // Build ticket payload
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    const fullCategory = subcategory ? `${category} > ${subcategory}` : category;
    const urgency = (form.querySelector('input[name="urgency"]:checked') as HTMLInputElement)?.value || 'normal';

    const summary = $<HTMLInputElement>('field-summary').value.trim();
    const description = $<HTMLTextAreaElement>('field-description').value.trim();

    const ticketData = {
        email: $<HTMLInputElement>('field-email').value.trim(),
        title: `[${fullCategory}] ${summary}`,
        body: formatTicketBody(description, fullCategory, urgency),
        priority: mapUrgencyToPriority(urgency),
        ninjaDeviceId: deviceContext?.ninjaDeviceId || undefined,
        userName: $<HTMLInputElement>('field-name').value.trim(),
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
            // Show success
            const ticketId = result.data.ticket.id;
            const refCode = `ATLAS-${ticketId.substring(0, 8).toUpperCase()}`;
            successRef.textContent = `Reference: ${refCode}`;
            viewForm.style.display = 'none';
            viewSuccess.style.display = 'flex';
        } else {
            showToast(result.error || 'Failed to submit ticket. Please try again.');
        }
    } catch (err) {
        console.error('Submit error:', err);
        showToast('Connection error. Please check your internet and try again.');
    } finally {
        setLoading(false);
    }
});

// ── Helpers ────────────────────────────────────────────────

function validateForm(): boolean {
    const name = $<HTMLInputElement>('field-name');
    const email = $<HTMLInputElement>('field-email');
    const summary = $<HTMLInputElement>('field-summary');
    const description = $<HTMLTextAreaElement>('field-description');

    let valid = true;

    [name, email, categorySelect, summary, description].forEach((el) => {
        el.classList.remove('error');
    });

    if (!name.value.trim()) { name.classList.add('error'); valid = false; }
    if (!email.value.trim() || !email.value.includes('@')) { email.classList.add('error'); valid = false; }
    if (!categorySelect.value) { categorySelect.classList.add('error'); valid = false; }
    if (!summary.value.trim()) { summary.classList.add('error'); valid = false; }
    if (!description.value.trim()) { description.classList.add('error'); valid = false; }

    if (!valid) {
        showToast('Please fill in all required fields.');
        // Focus first error
        const firstError = form.querySelector('.error') as HTMLElement;
        firstError?.focus();
    }

    return valid;
}

function formatTicketBody(
    description: string,
    category: string,
    urgency: string,
): string {
    const lines: string[] = [
        description,
        '',
        '───────────────────────────────',
        `Category: ${category}`,
        `Urgency: ${urgency.toUpperCase()}`,
        '',
        'Device Information:',
        `  Computer: ${deviceContext?.computerName || 'Unknown'}`,
        `  User: ${deviceContext?.loggedInUser || 'Unknown'}`,
        `  OS: ${deviceContext?.osVersion || 'Unknown'}`,
        `  IP: ${deviceContext?.ipAddress || 'Unknown'}`,
        `  Ninja ID: ${deviceContext?.ninjaDeviceId ?? 'Not found'}`,
        `  TeamViewer: ${deviceContext?.teamviewerId ?? 'Not installed'}`,
        `  Domain: ${deviceContext?.domain ?? 'N/A'}`,
        '───────────────────────────────',
        'Submitted via ATLAS Widget v1.0.0',
    ];
    return lines.join('\n');
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
    const btnText = btnSubmit.querySelector('.btn-text') as HTMLElement;
    const btnLoader = btnSubmit.querySelector('.btn-loader') as HTMLElement;
    btnSubmit.disabled = loading;
    btnText.style.display = loading ? 'none' : 'flex';
    btnLoader.style.display = loading ? 'flex' : 'none';
}

function showToast(message: string) {
    toastMessage.textContent = message;
    toastError.style.display = 'flex';
    setTimeout(hideToast, 5000);
}

function hideToast() {
    toastError.style.display = 'none';
}

function resetForm() {
    form.reset();
    subcategoryGroup.style.display = 'none';
    // Re-prefill user data
    if (deviceContext) {
        prefillUserFields(deviceContext);
    }
    // Reset urgency to "normal"
    const normalRadio = form.querySelector('input[name="urgency"][value="normal"]') as HTMLInputElement;
    if (normalRadio) normalRadio.checked = true;
}

// ── Boot ───────────────────────────────────────────────────
init();

export { };
