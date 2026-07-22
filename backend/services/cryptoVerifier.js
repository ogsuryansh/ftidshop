const https = require('https');

// ─── Helper: fetch JSON from URL ─────────────────────────────────────────────
function fetchJSON(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = { headers: { 'User-Agent': 'FTID-PayVerifier/1.0', ...headers } };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
            });
        }).on('error', reject);
    });
}

// ─── Get crypto price in USD from CoinGecko (FREE, no key) ───────────────────
async function getCryptoPrice(coinId) {
    try {
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        return data[coinId]?.usd || null;
    } catch (e) {
        console.error(`[CoinGecko] Price fetch failed for ${coinId}:`, e.message);
        return null;
    }
}

// ─── USDT TRC20 Verification (TronGrid - FREE, no key) ───────────────────────
async function verifyUSDT(address, amountUSD) {
    try {
        const contractAddr = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?contract_address=${contractAddr}&limit=20&only_confirmed=true`;
        const data = await fetchJSON(url);

        if (!data.data || !Array.isArray(data.data)) return { verified: false };

        const expectedAmount = amountUSD * 1e6; // USDT has 6 decimals
        const tolerance = 0.02;

        for (const tx of data.data) {
            const txAmount = parseFloat(tx.value);
            const diff = Math.abs(txAmount - expectedAmount) / expectedAmount;
            if (tx.to === address && diff <= tolerance) {
                return { verified: true, txHash: tx.transaction_id };
            }
        }
        return { verified: false };
    } catch (e) {
        console.error('[USDT Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── BTC Verification (Blockstream Esplora - FREE, no key) ───────────────────
async function verifyBTC(address, amountUSD) {
    try {
        const btcPrice = await getCryptoPrice('bitcoin');
        if (!btcPrice) return { verified: false, error: 'Could not fetch BTC price' };

        const expectedSatoshis = (amountUSD / btcPrice) * 1e8;
        const tolerance = 0.02;

        const txs = await fetchJSON(`https://blockstream.info/api/address/${address}/txs`);
        if (!Array.isArray(txs)) return { verified: false };

        for (const tx of txs) {
            if (tx.status?.confirmed !== true) continue;
            const received = tx.vout
                .filter(o => o.scriptpubkey_address === address)
                .reduce((sum, o) => sum + o.value, 0);

            const diff = Math.abs(received - expectedSatoshis) / expectedSatoshis;
            if (received > 0 && diff <= tolerance) {
                return { verified: true, txHash: tx.txid };
            }
        }
        return { verified: false };
    } catch (e) {
        console.error('[BTC Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── TON Verification (TON Center - FREE with API key) ───────────────────────
async function verifyTON(address, amountUSD) {
    const apiKey = process.env.TON_API_KEY;
    if (!apiKey) {
        console.warn('[TON Verify] No TON_API_KEY set in .env, skipping TON verification');
        return { verified: false, error: 'TON_API_KEY not configured' };
    }

    try {
        const tonPrice = await getCryptoPrice('the-open-network');
        if (!tonPrice) return { verified: false, error: 'Could not fetch TON price' };

        const expectedNano = (amountUSD / tonPrice) * 1e9;
        const tolerance = 0.02;

        const url = `https://toncenter.com/api/v3/transactions?account=${address}&limit=20`;
        const data = await fetchJSON(url, { 'X-API-Key': apiKey });

        if (!data.transactions || !Array.isArray(data.transactions)) return { verified: false };

        for (const tx of data.transactions) {
            const inMsg = tx.in_msg;
            if (!inMsg || inMsg.destination !== address) continue;
            const received = parseFloat(inMsg.value || 0);
            const diff = Math.abs(received - expectedNano) / expectedNano;
            if (received > 0 && diff <= tolerance) {
                return { verified: true, txHash: tx.hash };
            }
        }
        return { verified: false };
    } catch (e) {
        console.error('[TON Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── Main verify dispatcher ───────────────────────────────────────────────────
async function verifyPayment(currency, address, amountUSD) {
    console.log(`[CryptoVerifier] Checking ${currency} payment of $${amountUSD} to ${address}`);
    switch (currency) {
        case 'USDT_TRC20': return await verifyUSDT(address, amountUSD);
        case 'BTC':        return await verifyBTC(address, amountUSD);
        case 'TON':        return await verifyTON(address, amountUSD);
        default:           return { verified: false, error: 'Unknown currency' };
    }
}

module.exports = { verifyPayment };
