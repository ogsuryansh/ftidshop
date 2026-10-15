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

// ─── Get crypto price in USD (CoinGecko + Binance + CryptoCompare fallbacks) ──
async function getCryptoPrice(coinId) {
    // Try CoinGecko first
    try {
        const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        if (data && data[coinId]?.usd) return data[coinId].usd;
    } catch (e) {
        console.warn(`[CoinGecko] Price fetch failed for ${coinId}:`, e.message);
    }

    // Fallback: Binance ticker
    try {
        const binanceMap = {
            litecoin: 'LTCUSDT',
            bitcoin: 'BTCUSDT',
            solana: 'SOLUSDT',
            ethereum: 'ETHUSDT'
        };
        const symbol = binanceMap[coinId];
        if (symbol) {
            const bData = await fetchJSON(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            if (bData && bData.price) return parseFloat(bData.price);
        }
    } catch (e) {
        console.warn(`[Binance] Price fetch failed for ${coinId}:`, e.message);
    }

    // Fallback: CryptoCompare
    try {
        const ccMap = {
            litecoin: 'LTC',
            bitcoin: 'BTC',
            solana: 'SOL',
            ethereum: 'ETH',
            'the-open-network': 'TON'
        };
        const sym = ccMap[coinId];
        if (sym) {
            const ccData = await fetchJSON(`https://min-api.cryptocompare.com/data/price?fsym=${sym}&tsyms=USD`);
            if (ccData && ccData.USD) return parseFloat(ccData.USD);
        }
    } catch (e) {
        console.warn(`[CryptoCompare] Price fetch failed for ${coinId}:`, e.message);
    }

    return null;
}

// ─── USDT TRC20 Verification (TronGrid - FREE, no key) ───────────────────────
async function verifyUSDT(address, amountUSD) {
    try {
        const contractAddr = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?contract_address=${contractAddr}&limit=20&only_confirmed=true`;
        const data = await fetchJSON(url);

        if (!data.data || !Array.isArray(data.data)) return { verified: false };

        const expectedAmount = amountUSD * 1e6; // USDT has 6 decimals
        const tolerance = 0.05; // 5% tolerance

        for (const tx of data.data) {
            const txAmount = parseFloat(tx.value);
            const diff = Math.abs(txAmount - expectedAmount) / expectedAmount;
            if (tx.to === address && (diff <= tolerance || (txAmount >= expectedAmount * 0.95 && txAmount <= expectedAmount * 1.25))) {
                return { verified: true, txHash: tx.transaction_id };
            }
        }
        return { verified: false };
    } catch (e) {
        console.error('[USDT Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── BTC Verification (Blockstream + Mempool.space - Mempool + Confirmed) ────
async function verifyBTC(address, amountUSD) {
    try {
        const btcPrice = await getCryptoPrice('bitcoin');
        if (!btcPrice) return { verified: false, error: 'Could not fetch BTC price' };

        const expectedSatoshis = (amountUSD / btcPrice) * 1e8;
        const tolerance = 0.12; // 12% tolerance to absorb price shifts & exchange fees

        // Helper to match txs
        const checkTxs = (txList) => {
            if (!Array.isArray(txList)) return null;
            for (const tx of txList) {
                if (!tx || !Array.isArray(tx.vout)) continue;
                const received = tx.vout
                    .filter(o => o.scriptpubkey_address === address)
                    .reduce((sum, o) => sum + (o.value || 0), 0);

                const diff = Math.abs(received - expectedSatoshis) / expectedSatoshis;
                if (received > 0 && (diff <= tolerance || (received >= expectedSatoshis * 0.88 && received <= expectedSatoshis * 1.35))) {
                    return tx.txid;
                }
            }
            return null;
        };

        // Try Blockstream first
        try {
            const txs = await fetchJSON(`https://blockstream.info/api/address/${address}/txs`);
            const matchedTx = checkTxs(txs);
            if (matchedTx) return { verified: true, txHash: matchedTx };
        } catch (e) {
            console.warn('[BTC Blockstream failed, trying Mempool.space]:', e.message);
        }

        // Fallback: Mempool.space
        try {
            const txs = await fetchJSON(`https://mempool.space/api/address/${address}/txs`);
            const matchedTx = checkTxs(txs);
            if (matchedTx) return { verified: true, txHash: matchedTx };
        } catch (e) {
            console.warn('[BTC Mempool.space failed]:', e.message);
        }

        return { verified: false };
    } catch (e) {
        console.error('[BTC Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── TON Verification (TON Center - works without API key) ───────────────────
async function verifyTON(address, amountUSD) {
    try {
        const tonPrice = await getCryptoPrice('the-open-network');
        if (!tonPrice) return { verified: false, error: 'Could not fetch TON price' };

        const expectedNano = (amountUSD / tonPrice) * 1e9;
        const tolerance = 0.08;

        const apiKey = process.env.TON_API_KEY && process.env.TON_API_KEY !== 'YOUR_TON_API_KEY_HERE'
            ? process.env.TON_API_KEY : null;
        const headers = apiKey ? { 'X-API-Key': apiKey } : {};

        const url = `https://toncenter.com/api/v3/transactions?account=${address}&limit=20`;
        const data = await fetchJSON(url, headers);

        if (!data.transactions || !Array.isArray(data.transactions)) return { verified: false };

        for (const tx of data.transactions) {
            const inMsg = tx.in_msg;
            if (!inMsg || inMsg.destination !== address) continue;
            const received = parseFloat(inMsg.value || 0);
            const diff = Math.abs(received - expectedNano) / expectedNano;
            if (received > 0 && (diff <= tolerance || (received >= expectedNano * 0.90 && received <= expectedNano * 1.30))) {
                return { verified: true, txHash: tx.hash };
            }
        }
        return { verified: false };
    } catch (e) {
        console.error('[TON Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── LTC Verification (BlockCypher + Litecoinspace Mempool) ──────────────────
async function verifyLTC(address, amountUSD) {
    try {
        const ltcPrice = await getCryptoPrice('litecoin');
        if (!ltcPrice) return { verified: false, error: 'Could not fetch LTC price' };

        const expectedLitoshi = (amountUSD / ltcPrice) * 1e8; // 1 LTC = 1e8 litoshi
        const tolerance = 0.12; // 12% tolerance for price drift and fee handling

        const isAmountMatch = (value) => {
            const diff = Math.abs(value - expectedLitoshi) / expectedLitoshi;
            return diff <= tolerance || (value >= expectedLitoshi * 0.88 && value <= expectedLitoshi * 1.35);
        };

        // ── Provider 1: BlockCypher (Fast, supports bech32 ltc1q & unconfirmed mempool) ──
        try {
            const bcData = await fetchJSON(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}?limit=15`);
            if (bcData) {
                // Check unconfirmed mempool transactions first (instant detection)
                const unconfirmed = bcData.unconfirmed_txrefs || [];
                for (const tx of unconfirmed) {
                    if (tx.tx_input_n === -1 && isAmountMatch(tx.value)) {
                        console.log(`[LTC Verify] Detected unconfirmed tx on BlockCypher: ${tx.tx_hash}`);
                        return { verified: true, txHash: tx.tx_hash };
                    }
                }
                // Check confirmed transactions
                const confirmed = bcData.txrefs || [];
                for (const tx of confirmed) {
                    if (tx.tx_input_n === -1 && isAmountMatch(tx.value)) {
                        console.log(`[LTC Verify] Detected confirmed tx on BlockCypher: ${tx.tx_hash}`);
                        return { verified: true, txHash: tx.tx_hash };
                    }
                }
            }
        } catch (err) {
            console.warn('[LTC Verify] BlockCypher check failed, trying Litecoinspace:', err.message);
        }

        // ── Provider 2: Litecoinspace.org (Dedicated Mempool/Esplora instance for LTC) ──
        try {
            const txs = await fetchJSON(`https://litecoinspace.org/api/address/${address}/txs`);
            if (Array.isArray(txs)) {
                for (const tx of txs) {
                    if (!tx || !Array.isArray(tx.vout)) continue;
                    const received = tx.vout
                        .filter(o => o.scriptpubkey_address === address)
                        .reduce((sum, o) => sum + (o.value || 0), 0);

                    if (received > 0 && isAmountMatch(received)) {
                        console.log(`[LTC Verify] Detected tx on Litecoinspace: ${tx.txid}`);
                        return { verified: true, txHash: tx.txid };
                    }
                }
            }
        } catch (err) {
            console.warn('[LTC Verify] Litecoinspace check failed:', err.message);
        }

        // ── Provider 3: Blockchair fallback ──
        try {
            const data = await fetchJSON(`https://api.blockchair.com/litecoin/dashboards/address/${address}?limit=10`);
            if (data && data.data && data.data[address]) {
                const addrData = data.data[address];
                const utxos = addrData.utxo || [];
                for (const utxo of utxos) {
                    if (utxo.value > 0 && isAmountMatch(utxo.value)) {
                        return { verified: true, txHash: utxo.transaction_hash };
                    }
                }
            }
        } catch {}

        return { verified: false };
    } catch (e) {
        console.error('[LTC Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── SOL Verification (Helius API) ───────────────────────────────────────────
async function verifySOL(address, amountUSD) {
    const apiKey = process.env.SOL_API_KEY;
    if (!apiKey) {
        console.warn('[SOL Verify] No SOL_API_KEY set in .env');
        return { verified: false, error: 'SOL_API_KEY not configured' };
    }

    try {
        const solPrice = await getCryptoPrice('solana');
        if (!solPrice) return { verified: false, error: 'Could not fetch SOL price' };

        const expectedSol = amountUSD / solPrice;
        const tolerance = 0.03; // 3% tolerance

        const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}`;
        const data = await fetchJSON(url);

        if (!Array.isArray(data)) return { verified: false };

        const recent = data.slice(0, 10); // check last 10 transactions
        for (const tx of recent) {
            let solReceived = 0;
            if (tx.nativeTransfers) {
                for (const transfer of tx.nativeTransfers) {
                    if (transfer.toUserAccount === address) {
                        solReceived += transfer.amount / 1e9;
                    }
                }
            }
            
            const diff = Math.abs(solReceived - expectedSol) / expectedSol;
            if (solReceived > 0 && diff <= tolerance) {
                return { verified: true, txHash: tx.signature };
            }
        }

        return { verified: false };
    } catch (e) {
        console.error('[SOL Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── ETH Verification (Etherscan API) ─────────────────────────────────────────
async function verifyETH(address, amountUSD) {
    const apiKey = process.env.ETH_API_KEY;
    if (!apiKey) {
        console.warn('[ETH Verify] No ETH_API_KEY set in .env');
        return { verified: false, error: 'ETH_API_KEY not configured' };
    }

    try {
        const ethPrice = await getCryptoPrice('ethereum');
        if (!ethPrice) return { verified: false, error: 'Could not fetch ETH price' };

        const expectedWei = (amountUSD / ethPrice) * 1e18;
        const tolerance = 0.03; // 3% tolerance

        // Check last 5 transactions
        const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${apiKey}`;
        const data = await fetchJSON(url);

        if (data.status !== '1' || !Array.isArray(data.result)) return { verified: false };

        for (const tx of data.result) {
            // Check if transaction is incoming to the address
            if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                const receivedWei = parseFloat(tx.value);
                const diff = Math.abs(receivedWei - expectedWei) / expectedWei;
                
                if (receivedWei > 0 && diff <= tolerance) {
                    return { verified: true, txHash: tx.hash };
                }
            }
        }
        return { verified: false };
    } catch (e) {
        console.error('[ETH Verify]', e.message);
        return { verified: false, error: e.message };
    }
}

// ─── Main verify dispatcher ───────────────────────────────────────────────────
async function verifyPayment(currency, address, amountUSD) {
    console.log(`[CryptoVerifier] Checking ${currency} payment of $${amountUSD} to ${address}`);
    switch (currency) {
        case 'USDT_TRC20': return await verifyUSDT(address, amountUSD);
        case 'BTC':        return await verifyBTC(address, amountUSD);
        case 'LTC':        return await verifyLTC(address, amountUSD);
        case 'SOL':        return await verifySOL(address, amountUSD);
        case 'ETH':        return await verifyETH(address, amountUSD);
        case 'TON':        return await verifyTON(address, amountUSD);
        default:           return { verified: false, error: 'Unknown currency' };
    }
}

module.exports = { verifyPayment };
