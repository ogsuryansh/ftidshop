const https = require('https');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');

// Default fallback token and rate (token loaded securely from environment / Admin Settings)
const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DEFAULT_STARS_RATE = Number(process.env.TELEGRAM_STARS_RATE) || 90; // 90 Stars = $1 USD

// Helper: Make Telegram Bot API call
function telegramApi(token, method, data = {}) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'FTIDShop-Bot/1.0'
            },
            timeout: 30000
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    resolve({ ok: false, error: body });
                }
            });
        });

        req.on('error', err => reject(err));
        req.on('timeout', () => {
            req.destroy(new Error(`Telegram API timeout on ${method}`));
        });

        req.write(postData);
        req.end();
    });
}

// Get dynamic Bot Token from Settings or environment
async function getBotConfig() {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        return {
            token: settings.telegramBotToken || DEFAULT_BOT_TOKEN,
            rate: Number(settings.telegramStarsRate) || DEFAULT_STARS_RATE,
            enabled: settings.enableTelegramStars !== false,
            username: settings.telegramBotUsername || 'Shopstarsh1_bot'
        };
    } catch (e) {
        return {
            token: DEFAULT_BOT_TOKEN,
            rate: DEFAULT_STARS_RATE,
            enabled: true,
            username: 'Shopstarsh1_bot'
        };
    }
}

// ─── Create Telegram Stars Invoice Link ────────────────────────────────────────
async function createStarsInvoice({ orderId, title, description, priceUSD, userId }) {
    try {
        const config = await getBotConfig();
        if (!config.enabled) {
            return { success: false, error: 'Telegram Stars payments are currently disabled' };
        }
        if (!config.token) {
            return { success: false, error: 'Telegram Bot Token is not configured. Please add it in Admin Settings.' };
        }

        const price = Math.max(0.0001, Number(priceUSD) || 0.01);
        // Calculate stars based on dynamic rate (e.g. 90 Stars = $1 USD). Minimum is 1 Star (Telegram minimum).
        const starsAmount = Math.max(1, Math.round(price * config.rate));

        const cleanTitle = (title || 'FT!d Shop Order').slice(0, 32);
        const cleanDesc = (description || `Payment of ${starsAmount} Stars ($${price < 0.01 ? price.toFixed(4) : price.toFixed(2)})`).slice(0, 255);
        const payload = `order_${orderId}`;

        console.log(`[TelegramBot] Creating Stars invoice for order ${orderId}: ${starsAmount} Stars ($${price})`);

        const res = await telegramApi(config.token, 'createInvoiceLink', {
            title: cleanTitle,
            description: cleanDesc,
            payload: payload,
            provider_token: '', // Must be empty string for Telegram Stars (XTR)
            currency: 'XTR',    // Telegram Stars currency code
            prices: [
                { label: cleanTitle, amount: starsAmount }
            ]
        });

        if (res && res.ok && res.result) {
            return {
                success: true,
                invoiceLink: res.result,
                starsAmount: starsAmount,
                starsRate: config.rate,
                currency: 'XTR'
            };
        } else {
            console.error('[TelegramBot] createInvoiceLink failed:', res);
            return {
                success: false,
                error: res?.description || 'Failed to generate Telegram Stars invoice'
            };
        }
    } catch (err) {
        console.error('[TelegramBot] createStarsInvoice exception:', err.message);
        return { success: false, error: err.message };
    }
}

// ─── Process Incoming Telegram Updates (PreCheckoutQuery & SuccessfulPayment) ─
async function processUpdate(update) {
    if (!update) return;
    const config = await getBotConfig();

    try {
        // 1. Handle pre_checkout_query (Telegram requires ok: true response within 10s)
        if (update.pre_checkout_query) {
            const pq = update.pre_checkout_query;
            console.log(`[TelegramBot] 🔔 Received pre_checkout_query: id=${pq.id}, payload=${pq.invoice_payload}, amount=${pq.total_amount} Stars`);

            const answer = await telegramApi(config.token, 'answerPreCheckoutQuery', {
                pre_checkout_query_id: pq.id,
                ok: true
            });

            if (answer && answer.ok) {
                console.log(`[TelegramBot] ✅ Approved pre_checkout_query for ${pq.invoice_payload}`);
            } else {
                console.error(`[TelegramBot] Failed to answer pre_checkout_query:`, answer);
            }
            return;
        }

        // 2. Handle successful_payment
        if (update.message && update.message.successful_payment) {
            const msg = update.message;
            const sp = msg.successful_payment;
            console.log(`[TelegramBot] 💰 Received successful_payment! Amount: ${sp.total_amount} Stars, Payload: ${sp.invoice_payload}, Charge ID: ${sp.telegram_payment_charge_id}`);

            let orderId = sp.invoice_payload;
            if (orderId && orderId.startsWith('order_')) {
                orderId = orderId.slice(6);
            }

            if (!orderId) {
                console.error('[TelegramBot] No orderId found in payload:', sp.invoice_payload);
                return;
            }

            const order = await Order.findById(orderId);
            if (!order) {
                console.error(`[TelegramBot] Order not found for id: ${orderId}`);
                return;
            }

            if (order.paymentStatus === 'Paid') {
                console.log(`[TelegramBot] Order ${orderId} already marked Paid. Skipping duplicate.`);
                return;
            }

            // Mark order as Paid in DB
            order.paymentStatus = 'Paid';
            order.status = 'Pending';
            order.paymentCurrency = 'TELEGRAM_STARS';
            order.paymentProvider = 'telegram_stars';
            order.txHash = sp.telegram_payment_charge_id || sp.provider_payment_charge_id || `stars_${Date.now()}`;
            order.telegramPaymentChargeId = sp.telegram_payment_charge_id;
            order.telegramStarsAmount = sp.total_amount;
            await order.save();

            // Auto-Processing for Deposits: Credit user wallet immediately
            if (order.type === 'deposit' || order.type === 'Deposit') {
                let settings = await Settings.findOne();
                if (!settings) settings = new Settings();

                let bonus = 0;
                if (order.price >= settings.depositBonusThreshold) {
                    bonus = (order.price * settings.depositBonusPercentage) / 100;
                }
                const totalAmount = order.price + bonus;

                await User.findByIdAndUpdate(order.userId, { $inc: { credits: totalAmount } });
                order.status = 'Completed';
                await order.save();

                console.log(`[TelegramBot] 💳 Auto-credited $${totalAmount} ($${order.price} + $${bonus} bonus) to user ${order.userId} for deposit ${order._id}`);
            }

            console.log(`[TelegramBot] ✅ Order ${order._id} successfully confirmed via Telegram Stars!`);

            // Send confirmation receipt back to user in Telegram
            if (msg.chat && msg.chat.id) {
                const confirmationText = 
                    `🎉 *Payment Confirmed!*\n\n` +
                    `⭐ *Paid:* ${sp.total_amount} Telegram Stars\n` +
                    `💵 *Amount:* $${order.price.toFixed(2)} USD\n` +
                    `📦 *Order / Item:* ${order.name || order.type || 'Service'}\n` +
                    `🆔 *Order ID:* \`${order._id}\`\n\n` +
                    (order.type === 'deposit' || order.type === 'Deposit'
                        ? `✅ *Your wallet balance has been credited instantly!*\n`
                        : `✅ *Your order has been submitted and is now being processed.*\n`) +
                    `\nThank you for shopping with us!`;

                await telegramApi(config.token, 'sendMessage', {
                    chat_id: msg.chat.id,
                    text: confirmationText,
                    parse_mode: 'Markdown'
                }).catch(e => console.warn('[TelegramBot] Could not send receipt message:', e.message));
            }
            return;
        }

        // 3. Handle standard user messages (e.g. /start or /help)
        if (update.message && update.message.text) {
            const msg = update.message;
            const text = msg.text.trim();

            if (text.startsWith('/start') || text.startsWith('/help')) {
                const welcomeText = 
                    `👋 *Welcome to FT!d Shop Official Bot!*\n\n` +
                    `⭐ We accept *Telegram Stars* for instant wallet deposits and order payments.\n` +
                    `💱 *Exchange Rate:* ${config.rate} Stars = $1.00 USD\n\n` +
                    `🌐 Visit our website to create an order or top up your wallet:\n` +
                    `👉 https://ftid.shop\n\n` +
                    `When checking out, select *Telegram Stars* to pay directly with one tap!`;

                await telegramApi(config.token, 'sendMessage', {
                    chat_id: msg.chat.id,
                    text: welcomeText,
                    parse_mode: 'Markdown'
                }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('[TelegramBot] Error processing update:', err);
    }
}

// ─── Long-Polling Loop (Runs on Node.js backend when hosted) ─────────────────
let isPolling = false;
let pollingOffset = 0;
let pollingTimeoutId = null;

async function pollUpdates() {
    if (!isPolling) return;

    try {
        const config = await getBotConfig();
        if (!config.enabled || !config.token) {
            pollingTimeoutId = setTimeout(pollUpdates, 10000);
            return;
        }

        const res = await telegramApi(config.token, 'getUpdates', {
            offset: pollingOffset,
            timeout: 20,
            allowed_updates: ['message', 'pre_checkout_query']
        });

        if (res && res.ok && Array.isArray(res.result)) {
            for (const update of res.result) {
                pollingOffset = update.update_id + 1;
                await processUpdate(update);
            }
        }
    } catch (err) {
        // Connection error or network glitch - wait 5s and resume cleanly
        if (!err.message?.includes('timeout')) {
            console.warn('[TelegramBot] Polling connection notice:', err.message);
        }
    }

    if (isPolling) {
        pollingTimeoutId = setTimeout(pollUpdates, 1000);
    }
}

function start() {
    if (isPolling) return;
    isPolling = true;
    console.log('[TelegramBot] 🚀 Starting Telegram Stars Bot polling service...');
    // Initial verification
    getBotConfig().then(cfg => {
        if (!cfg.token) {
            console.warn('[TelegramBot] No bot token configured.');
            return;
        }
        telegramApi(cfg.token, 'getMe').then(me => {
            if (me && me.ok) {
                console.log(`[TelegramBot] Connected as @${me.result.username} (${me.result.first_name}) | Rate: ${cfg.rate} Stars = $1 USD`);
            } else {
                console.warn('[TelegramBot] Bot verification warning:', me);
            }
        }).catch(err => {
            console.warn('[TelegramBot] Bot getMe notice:', err.message);
        });
    });

    pollUpdates();
}

function stop() {
    isPolling = false;
    if (pollingTimeoutId) clearTimeout(pollingTimeoutId);
    console.log('[TelegramBot] Bot polling stopped.');
}

async function reloadConfig() {
    console.log('[TelegramBot] Reloading configuration from settings...');
    const cfg = await getBotConfig();
    try {
        if (!cfg.token) {
            console.warn('[TelegramBot] No token configured after reload.');
            return;
        }
        const me = await telegramApi(cfg.token, 'getMe');
        if (me && me.ok) {
            console.log(`[TelegramBot] Verified bot @${me.result.username} (${me.result.first_name}) | Rate: ${cfg.rate} Stars = $1 USD`);
            if (me.result.username) {
                await Settings.updateOne({}, { telegramBotUsername: me.result.username });
            }
        }
        if (cfg.enabled && !isPolling) {
            start();
        }
    } catch (e) {
        console.warn('[TelegramBot] reloadConfig notice:', e.message);
    }
}

module.exports = {
    start,
    stop,
    reloadConfig,
    createStarsInvoice,
    processUpdate,
    getBotConfig
};
