// Trybit crypto payment gateway client (https://docs.trybit.com)
const API_BASE = 'https://api.trybit.com/v2';

function cfg() {
    return {
        apiKey: process.env.TRYBIT_API_KEY,
        shopId: process.env.TRYBIT_SHOP_ID,
        secret: process.env.TRYBIT_SECRET_KEY
    };
}

function isConfigured() {
    const { apiKey, shopId } = cfg();
    return !!(apiKey && shopId);
}

async function call(path, body) {
    const { apiKey } = cfg();
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    let data = null;
    try { data = await res.json(); } catch (_) { /* non-JSON response */ }
    if (!res.ok || !data || data.status !== 'success') {
        const msg = (data && (data.message || data.detail || data.error)) || `HTTP ${res.status}`;
        throw new Error(`Trybit API error: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    }
    return data.result;
}

// Creates an invoice. `amount` is in USD. `orderId` is our own order id (echoed back in postback).
async function createInvoice({ amount, orderId, email, lifetimeHours = 24 }) {
    const { shopId } = cfg();
    const body = {
        shop_id: shopId,
        amount: Number(amount),
        currency: 'USD',
        order_id: String(orderId),
        add_fields: { time_to_pay: { hours: lifetimeHours, minutes: 0 } }
    };
    if (email) body.email = email;
    return call('/invoice/create', body);
}

// Server-to-server lookup of an invoice by uuid (INV-XXXXXXXX or XXXXXXXX)
async function getInvoice(uuid) {
    const result = await call('/invoice/merchant/info', { uuids: [String(uuid)] });
    return Array.isArray(result) ? result[0] : result;
}

// Invoice is considered settled only for these statuses
function isPaidStatus(status) {
    return status === 'paid' || status === 'overpaid';
}

module.exports = { isConfigured, createInvoice, getInvoice, isPaidStatus, cfg };
