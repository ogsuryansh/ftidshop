require('dotenv').config();
const https = require('https');

function fetchJSON(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = { headers: { 'User-Agent': 'FTID-WalletTest/1.0', ...headers } };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
            });
        }).on('error', reject);
    });
}

function sep(label) {
    console.log('\n' + '═'.repeat(60));
    console.log(`  ${label}`);
    console.log('═'.repeat(60));
}

// ── USDT TRC20 (TronGrid) ──────────────────────────────────────
async function testUSDT(address) {
    sep(`USDT TRC20 — ${address}`);
    try {
        const contractAddr = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?contract_address=${contractAddr}&limit=5&only_confirmed=true`;
        const data = await fetchJSON(url);
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            console.log('  ⚠ No USDT transactions found (or API error)');
            console.log('  Raw:', JSON.stringify(data).slice(0, 300));
            return;
        }
        data.data.slice(0, 5).forEach((tx, i) => {
            const usdtAmount = (parseFloat(tx.value) / 1e6).toFixed(2);
            const direction = tx.to === address ? '📥 IN ' : '📤 OUT';
            console.log(`  [${i+1}] ${direction}  $${usdtAmount} USDT  |  TX: ${tx.transaction_id?.slice(0, 20)}...`);
        });
        console.log('  ✅ API working');
    } catch (e) {
        console.log('  ❌ Error:', e.message);
    }
}

// ── BTC (Blockstream) ─────────────────────────────────────────
async function testBTC(address) {
    sep(`BTC — ${address}`);
    try {
        const txs = await fetchJSON(`https://blockstream.info/api/address/${address}/txs`);
        if (!Array.isArray(txs) || txs.length === 0) {
            console.log('  ⚠ No BTC transactions found');
            return;
        }
        txs.slice(0, 5).forEach((tx, i) => {
            const received = tx.vout.filter(o => o.scriptpubkey_address === address).reduce((s, o) => s + o.value, 0);
            const sent = tx.vin.filter(v => v.prevout?.scriptpubkey_address === address).reduce((s, v) => s + (v.prevout?.value || 0), 0);
            const net = received - sent;
            const direction = net >= 0 ? '📥 IN ' : '📤 OUT';
            const btcAmt = (Math.abs(net) / 1e8).toFixed(8);
            const confirmed = tx.status?.confirmed ? '✓' : '⏳';
            console.log(`  [${i+1}] ${direction}  ${btcAmt} BTC  ${confirmed}  |  TX: ${tx.txid?.slice(0, 20)}...`);
        });
        console.log('  ✅ API working');
    } catch (e) {
        console.log('  ❌ Error:', e.message);
    }
}

// ── LTC (Blockchair - supports bech32) ────────────────────────
async function testLTC(address) {
    sep(`LTC — ${address}`);
    try {
        const data = await fetchJSON(`https://api.blockchair.com/litecoin/dashboards/address/${address}?limit=5`);
        if (!data || !data.data || !data.data[address]) {
            console.log('  ⚠ No data returned from Blockchair');
            console.log('  Raw:', JSON.stringify(data).slice(0, 300));
            return;
        }
        const addrData = data.data[address];
        const txList = (addrData.transactions || []).slice(0, 5);
        const utxos = addrData.utxo || [];

        console.log(`  Balance: ${(addrData.address?.balance / 1e8 || 0).toFixed(8)} LTC`);
        console.log(`  Total received: ${(addrData.address?.received / 1e8 || 0).toFixed(8)} LTC`);
        console.log(`  UTXOs: ${utxos.length}`);
        utxos.slice(0, 3).forEach((u, i) => {
            console.log(`    UTXO[${i+1}]: ${(u.value / 1e8).toFixed(8)} LTC  TX: ${u.transaction_hash?.slice(0, 20)}...`);
        });
        console.log(`  Last ${txList.length} tx hashes:`);
        txList.forEach((h, i) => console.log(`    [${i+1}] ${h}`));
        console.log('  ✅ API working (bech32 supported)');
    } catch (e) {
        console.log('  ❌ Error:', e.message);
    }
}

// ── SOL (Helius) ──────────────────────────────────────────────
async function testSOL(address) {
    sep(`SOL — ${address}`);
    const apiKey = process.env.SOL_API_KEY;
    if (!apiKey) { console.log('  ❌ SOL_API_KEY not set'); return; }
    try {
        const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=5`;
        const data = await fetchJSON(url);
        if (!Array.isArray(data) || data.length === 0) {
            console.log('  ⚠ No SOL transactions found');
            console.log('  Raw:', JSON.stringify(data).slice(0, 300));
            return;
        }
        data.slice(0, 5).forEach((tx, i) => {
            let received = 0;
            (tx.nativeTransfers || []).forEach(t => {
                if (t.toUserAccount === address) received += t.amount / 1e9;
            });
            const dir = received > 0 ? '📥 IN ' : '📤 OUT';
            console.log(`  [${i+1}] ${dir}  ${received.toFixed(6)} SOL  |  TX: ${tx.signature?.slice(0, 20)}...`);
        });
        console.log('  ✅ API working');
    } catch (e) {
        console.log('  ❌ Error:', e.message);
    }
}

// ── ETH (Etherscan) ───────────────────────────────────────────
async function testETH(address) {
    sep(`ETH — ${address}`);
    const apiKey = process.env.ETH_API_KEY;
    if (!apiKey) { console.log('  ❌ ETH_API_KEY not set'); return; }
    try {
        const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${apiKey}`;
        const data = await fetchJSON(url);
        if (data.status !== '1' || !Array.isArray(data.result) || data.result.length === 0) {
            console.log('  ⚠ No ETH transactions found or API error');
            console.log('  Message:', data.message, '| Result:', JSON.stringify(data.result).slice(0, 200));
            return;
        }
        data.result.slice(0, 5).forEach((tx, i) => {
            const ethAmt = (parseFloat(tx.value) / 1e18).toFixed(6);
            const direction = tx.to?.toLowerCase() === address.toLowerCase() ? '📥 IN ' : '📤 OUT';
            console.log(`  [${i+1}] ${direction}  ${ethAmt} ETH  |  TX: ${tx.hash?.slice(0, 20)}...`);
        });
        console.log('  ✅ API working');
    } catch (e) {
        console.log('  ❌ Error:', e.message);
    }
}

// ── TON (TonCenter) ───────────────────────────────────────────
async function testTON(address) {
    sep(`TON — ${address}`);
    try {
        const apiKey = process.env.TON_API_KEY && process.env.TON_API_KEY !== 'YOUR_TON_API_KEY_HERE'
            ? process.env.TON_API_KEY : null;
        const headers = apiKey ? { 'X-API-Key': apiKey } : {};
        if (!apiKey) console.log('  ℹ No TON_API_KEY set — using public endpoint (rate limited)');

        const url = `https://toncenter.com/api/v3/transactions?account=${address}&limit=5`;
        const data = await fetchJSON(url, headers);

        if (!data.transactions || !Array.isArray(data.transactions) || data.transactions.length === 0) {
            console.log('  ⚠ No TON transactions found');
            console.log('  Raw:', JSON.stringify(data).slice(0, 300));
            return;
        }
        data.transactions.slice(0, 5).forEach((tx, i) => {
            const inMsg = tx.in_msg;
            const tonAmt = inMsg ? (parseFloat(inMsg.value || 0) / 1e9).toFixed(6) : '0';
            const direction = inMsg && inMsg.destination === address ? '📥 IN ' : '📤 OUT';
            console.log(`  [${i+1}] ${direction}  ${tonAmt} TON  |  TX: ${tx.hash?.slice(0, 20)}...`);
        });
        console.log('  ✅ API working');
    } catch (e) {
        console.log('  ❌ Error:', e.message);
    }
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
    console.log('\n🔍 Testing last 5 transactions from each admin wallet...\n');

    // These are fetched from DB (set via Admin Panel) - using current values from Settings
    const wallets = {
        USDT_TRC20: 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR',
        BTC:        '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ',
        LTC:        'ltc1qd909zrrfr7s4ys0zt8rlcxjvu9j5p3w6rpjcwa',
        SOL:        '6SthbfqV4pG7Gs74cZwVv6n4vtuKPWk3ByRNABk71Az3',
        ETH:        '0x54defcf541d174e7443c1ada58875e3e04ca5178',
        TON:        'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM'
    };

    await testUSDT(wallets.USDT_TRC20);
    await testBTC(wallets.BTC);
    await testLTC(wallets.LTC);
    await testSOL(wallets.SOL);
    await testETH(wallets.ETH);
    await testTON(wallets.TON);

    console.log('\n' + '═'.repeat(60));
    console.log('  Test complete.');
    console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
