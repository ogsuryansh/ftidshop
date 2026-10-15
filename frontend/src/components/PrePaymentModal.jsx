import React from 'react';

// ─── Pre-Payment Modal (verifies blockchain BEFORE saving order) ────────────
function PrePaymentModal({ orderData, apiBase, onClose, onPaymentConfirmed }) {
  const [selectedCrypto, setSelectedCrypto] = React.useState('USDT_TRC20');
  const [walletAddress, setWalletAddress] = React.useState('');
  const [checkStatus, setCheckStatus] = React.useState('idle'); // idle | checking | confirmed | failed
  const [attempts, setAttempts] = React.useState(0);
  const [txHash, setTxHash] = React.useState('');
  const [copied, setCopied] = React.useState('');
  const [showQR, setShowQR] = React.useState(false);
  const pollRef = React.useRef(null);
  const isCheckingRef = React.useRef(false);

  const defaultAddresses = {
    USDT_TRC20: 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR',
    BTC: '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ',
    LTC: 'ltc1qd909zrrfr7s4ys0zt8rlcxjvu9j5p3w6rpjcwa',
    SOL: '6SthbfqV4pG7Gs74cZwVv6n4vtuKPWk3ByRNABk71Az3',
    ETH: '0x54defcf541d174e7443c1ada58875e3e04ca5178',
    TON: 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM'
  };

  const cryptoLabels = { USDT_TRC20: 'USDT (TRC20)', BTC: 'Bitcoin (BTC)', LTC: 'Litecoin (LTC)', SOL: 'Solana (SOL)', ETH: 'Ethereum (ETH)', TON: 'TON' };
  const cryptoIcons = { USDT_TRC20: '₮', BTC: '₿', LTC: 'Ł', SOL: '◎', ETH: 'Ξ', TON: '💎' };

  // Fetch real wallet address from backend when crypto changes
  React.useEffect(() => {
    setWalletAddress(defaultAddresses[selectedCrypto] || '');
    setCheckStatus('idle');
    fetch(`${apiBase}/api/payment/address/${selectedCrypto}`)
      .then(r => r.json())
      .then(d => { if (d.address) setWalletAddress(d.address); })
      .catch(() => {});
  }, [selectedCrypto]);

  React.useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const displayAddress = walletAddress || defaultAddresses[selectedCrypto] || '';
  const qrCodeUrl = displayAddress ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(displayAddress)}` : '';

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2500);
  };

  const checkPayment = React.useCallback(async () => {
    if (checkStatus === 'confirmed' || isCheckingRef.current) return;
    isCheckingRef.current = true;
    setCheckStatus('checking');
    try {
      // Check blockchain WITHOUT saving order yet
      const res = await fetch(`${apiBase}/api/verify-payment/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCrypto, address: displayAddress, amount: orderData.price })
      });
      const data = await res.json();
      setAttempts(a => a + 1);

      if (data.verified) {
        if (pollRef.current) clearInterval(pollRef.current);
        // NOW save order to DB as Paid
        const orderRes = await fetch(`${apiBase}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderData,
            paymentStatus: 'Paid',
            status: 'Pending',
            paymentCurrency: selectedCrypto,
            paymentAddress: displayAddress,
            txHash: data.txHash || ''
          })
        });
        const savedOrder = await orderRes.json();
        setTxHash(data.txHash || '');
        setCheckStatus('confirmed');
        if (onPaymentConfirmed) onPaymentConfirmed(savedOrder);
      } else {
        setCheckStatus('idle');
        if (data.message) {
           console.log(data.message);
        }
      }
    } catch (e) {
      console.error(e);
      setCheckStatus('idle');
    } finally {
      isCheckingRef.current = false;
    }
  }, [selectedCrypto, displayAddress, orderData, checkStatus, apiBase, onPaymentConfirmed]);

  const startPolling = () => {
    if (pollRef.current) return;
    checkPayment();
    pollRef.current = setInterval(checkPayment, 30000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(5, 7, 10, 0.88)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px', overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#12151a',
        background: 'linear-gradient(145deg, #161a22 0%, #0e1014 100%)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '20px', width: '100%', maxWidth: '460px',
        maxHeight: '85vh', overflowY: 'auto', margin: 'auto',
        padding: '20px 18px', color: '#ffffff', boxSizing: 'border-box',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)', position: 'relative'
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '30px', height: '30px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#aaa', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', outline: 'none'
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px', paddingRight: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '46px', height: '46px', borderRadius: '50%',
            background: checkStatus === 'confirmed'
              ? 'linear-gradient(135deg, rgba(72,164,100,0.3), rgba(0,242,254,0.2))'
              : 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(127,0,255,0.3))',
            border: checkStatus === 'confirmed' ? '1px solid #48a464' : '1px solid #00f2fe',
            fontSize: '22px', marginBottom: '8px'
          }}>
            {checkStatus === 'confirmed' ? '✅' : '💳'}
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>
            {checkStatus === 'confirmed' ? 'Payment Verified!' : 'Complete Payment'}
          </h3>
          <span style={{
            background: checkStatus === 'confirmed' ? 'linear-gradient(90deg,#48a464,#00f2fe)' : 'linear-gradient(90deg,#00f2fe,#7f00ff)',
            color: '#fff', padding: '3px 12px', borderRadius: '20px',
            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase'
          }}>
            {checkStatus === 'confirmed' ? '✔ Order Placed' : 'Awaiting Payment'}
          </span>
        </div>

        {/* Confirmed View */}
        {checkStatus === 'confirmed' && (
          <div style={{
            backgroundColor: 'rgba(72,164,100,0.12)', border: '1px solid #48a464',
            borderRadius: '14px', padding: '16px', marginBottom: '10px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '15px', color: '#48a464', fontWeight: '700', marginBottom: '6px' }}>🎉 Payment Confirmed! Order Placed.</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '12px' }}>Your order has been saved and is now in progress.</div>
            {txHash && <div style={{ fontSize: '10px', color: '#888', background: '#0a0b0d', padding: '8px 10px', borderRadius: '8px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '12px' }}>TX: {txHash}</div>}
            <button onClick={onClose} style={{
              width: '100%', background: 'linear-gradient(135deg,#00f2fe,#7f00ff)',
              color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer'
            }}>Done & Close</button>
          </div>
        )}

        {checkStatus !== 'confirmed' && (
          <>
            {/* Amount box */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>Amount Due:</span>
                <span style={{ color: '#00f2fe', fontSize: '18px', fontWeight: '800' }}>${orderData.price} USD</span>
              </div>
            </div>

            {/* Crypto select */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#8a94a6', marginBottom: '4px', textTransform: 'uppercase' }}>Select Payment Coin</label>
              <select value={selectedCrypto} onChange={e => setSelectedCrypto(e.target.value)} style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1a1e26',
                color: '#fff', border: '1px solid rgba(0,242,254,0.4)', fontSize: '13px', fontWeight: '700',
                outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
              }}>
                {Object.keys(cryptoLabels).map(k => (
                  <option key={k} value={k} style={{ backgroundColor: '#161a22', color: '#fff' }}>
                    {cryptoIcons[k]} {cryptoLabels[k]}
                  </option>
                ))}
              </select>
            </div>

            {/* QR */}
            {qrCodeUrl && (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <button type="button" onClick={() => setShowQR(!showQR)} style={{ background: 'transparent', border: 'none', color: '#00f2fe', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
                  {showQR ? '▲ Hide QR Code' : '📷 Show QR Code'}
                </button>
                {showQR && (
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '12px' }}>
                      <img src={qrCodeUrl} alt="QR Code" style={{ width: '120px', height: '120px', display: 'block' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Address box */}
            <div style={{ backgroundColor: '#0a0c10', border: '1px dashed rgba(0,242,254,0.35)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#8a94a6', textTransform: 'uppercase', marginBottom: '6px' }}>Deposit Address ({selectedCrypto})</div>
              <div style={{
                backgroundColor: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                padding: '10px', color: '#00f2fe', fontFamily: 'monospace', fontSize: '12px',
                wordBreak: 'break-all', marginBottom: '8px', textAlign: 'center'
              }}>{displayAddress || 'Loading...'}</div>
              <button type="button" onClick={() => handleCopy(displayAddress, selectedCrypto)} style={{
                width: '100%',
                background: copied === selectedCrypto ? 'linear-gradient(135deg,#48a464,#2e7d32)' : 'linear-gradient(135deg,#00f2fe,#7f00ff)',
                color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px'
              }}>{copied === selectedCrypto ? '✔ Copied!' : '📋 Copy Address'}</button>
            </div>

            {/* Status banner */}
            {checkStatus === 'checking' && (
              <div style={{ textAlign: 'center', padding: '10px', marginBottom: '12px', backgroundColor: 'rgba(0,242,254,0.08)', borderRadius: '10px', border: '1px solid rgba(0,242,254,0.3)', fontSize: '12px', color: '#00f2fe', fontWeight: '600' }}>
                ⏳ Scanning blockchain... {attempts > 0 && `(Check #${attempts})`}
              </div>
            )}
            {checkStatus === 'idle' && attempts > 0 && (
              <div style={{ textAlign: 'center', padding: '8px', marginBottom: '12px', fontSize: '11px', color: '#8a94a6' }}>
                Payment not detected yet. Auto-checking every 30s... (Check #{attempts})
              </div>
            )}

            <div style={{ fontSize: '10px', color: '#8a94a6', lineHeight: '1.4', marginBottom: '14px', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #00f2fe', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              📌 Send exactly <strong>${orderData.price} USD</strong> in {cryptoLabels[selectedCrypto]}. Your order will be placed automatically after blockchain confirms.
            </div>

            <button type="button" onClick={startPolling} disabled={checkStatus === 'checking' || !displayAddress} style={{
              width: '100%',
              background: checkStatus === 'checking' ? '#262b36' : 'linear-gradient(135deg,#00f2fe 0%,#7f00ff 100%)',
              color: '#fff', border: 'none', padding: '13px', borderRadius: '10px',
              fontWeight: '800', fontSize: '14px', cursor: checkStatus === 'checking' ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 18px rgba(0,242,254,0.25)'
            }}>
              {checkStatus === 'checking' ? '🔍 Scanning Blockchain...' : attempts > 0 ? '🔄 Check Again Now' : '✅ I Have Sent Payment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PrePaymentModal;
