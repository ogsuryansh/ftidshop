import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';

export default function PaymentModal({ order, onClose, onPaymentConfirmed }) {
  const [copied, setCopied] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT_TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [checkStatus, setCheckStatus] = useState('idle'); // idle | checking | confirmed | failed
  const [txHash, setTxHash] = useState('');
  const [attempts, setAttempts] = useState(0);
  const pollRef = useRef(null);

  if (!order) return null;

  // Fetch real wallet address from backend
  useEffect(() => {
    setWalletAddress('');
    setCheckStatus('idle');
    fetch(`${API_BASE}/api/payment/address/${selectedCrypto}`)
      .then(r => r.json())
      .then(d => { if (d.address) setWalletAddress(d.address); })
      .catch(() => {});
  }, [selectedCrypto]);

  // Save payment currency to order when user picks it
  const handleCryptoSelect = async (currency) => {
    setSelectedCrypto(currency);
    if (order._id) {
      fetch(`${API_BASE}/api/admin/order/${order._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentCurrency: currency })
      }).catch(() => {});
    }
  };

  const checkPayment = useCallback(async () => {
    if (!order._id || checkStatus === 'confirmed') return;
    setCheckStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/api/verify-payment/${order._id}`, { method: 'POST' });
      const data = await res.json();
      setAttempts(a => a + 1);
      if (data.verified) {
        setCheckStatus('confirmed');
        setTxHash(data.txHash || '');
        if (pollRef.current) clearInterval(pollRef.current);
        if (onPaymentConfirmed) onPaymentConfirmed(data.order);
      } else {
        setCheckStatus('idle');
      }
    } catch (e) {
      setCheckStatus('idle');
    }
  }, [order._id, checkStatus, onPaymentConfirmed]);

  // Auto-poll every 30 seconds after user clicks "I Have Sent Payment"
  const startPolling = () => {
    if (pollRef.current) return;
    checkPayment(); // immediate first check
    pollRef.current = setInterval(checkPayment, 30000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const displayAddress = walletAddress || 'Loading...';

  const cryptoLabels = { USDT_TRC20: 'USDT (TRC20)', BTC: 'Bitcoin (BTC)', TON: 'TON' };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px', overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#1e2022', border: '1px solid #333', borderRadius: '12px',
        width: '100%', maxWidth: '550px', padding: '25px', color: '#fff', boxSizing: 'border-box',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#888', fontSize: '22px', cursor: 'pointer' }}>
          &times;
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: checkStatus === 'confirmed' ? 'rgba(72,164,100,0.2)' : 'rgba(0, 242, 254, 0.15)', color: checkStatus === 'confirmed' ? '#48a464' : '#00f2fe', fontSize: '26px', marginBottom: '10px' }}>
            {checkStatus === 'confirmed' ? '✅' : '💳'}
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '600' }}>
            {checkStatus === 'confirmed' ? 'Payment Confirmed!' : 'Complete Your Payment'}
          </h3>
          <span style={{ background: checkStatus === 'confirmed' ? 'linear-gradient(90deg,#48a464,#00f2fe)' : 'linear-gradient(90deg, #00f2fe, #7f00ff)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            {checkStatus === 'confirmed' ? '✔ Paid' : order.paymentStatus || 'Pending Payment'}
          </span>
        </div>

        {/* Confirmed state */}
        {checkStatus === 'confirmed' && (
          <div style={{ backgroundColor: 'rgba(72,164,100,0.1)', border: '1px solid #48a464', borderRadius: '8px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#48a464', fontWeight: '600', marginBottom: '6px' }}>🎉 Payment detected on blockchain!</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Your order is now being processed.</div>
            {txHash && <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', fontFamily: 'monospace', wordBreak: 'break-all' }}>TX: {txHash}</div>}
            <button onClick={onClose} style={{ marginTop: '15px', background: 'linear-gradient(135deg,#00f2fe,#7f00ff)', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        )}

        {/* Payment flow (hidden after confirmed) */}
        {checkStatus !== 'confirmed' && (<>
          {/* Order summary */}
          <div style={{ backgroundColor: '#141617', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid #282a2c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#aaa' }}>Order Type:</span>
              <span style={{ fontWeight: '500' }}>{order.type || 'Order'} ({order.method || order.country || 'Standard'})</span>
            </div>
            {order.trackingNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#aaa' }}>Tracking:</span>
                <span style={{ fontFamily: 'monospace', color: '#ddd' }}>{order.trackingNumber}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #282a2c', paddingTop: '8px', marginTop: '8px' }}>
              <span style={{ color: '#aaa', fontWeight: '600' }}>Total Amount Due:</span>
              <span style={{ color: '#00f2fe', fontSize: '18px', fontWeight: 'bold' }}>${order.price || 0} USD</span>
            </div>
          </div>

          {/* Currency selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>Select Payment Currency</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['USDT_TRC20', 'BTC', 'TON'].map(c => (
                <button
                  key={c} type="button"
                  onClick={() => handleCryptoSelect(c)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 'bold', border: 'none', transition: 'all 0.2s',
                    background: selectedCrypto === c ? 'linear-gradient(135deg, #00f2fe, #7f00ff)' : '#282a2c',
                    color: '#fff'
                  }}
                >
                  {cryptoLabels[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet address */}
          <div style={{ backgroundColor: '#141617', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #444' }}>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>
              Deposit Address ({cryptoLabels[selectedCrypto]})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text" readOnly value={displayAddress}
                style={{ flex: 1, backgroundColor: '#0c0d0e', border: '1px solid #333', color: '#00f2fe', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', outline: 'none' }}
              />
              <button
                type="button" onClick={() => handleCopy(displayAddress, selectedCrypto)}
                style={{ background: 'linear-gradient(135deg, #00f2fe, #7f00ff)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                {copied === selectedCrypto ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Checking status */}
          {checkStatus === 'checking' && (
            <div style={{ textAlign: 'center', padding: '10px', marginBottom: '15px', backgroundColor: 'rgba(0,242,254,0.05)', borderRadius: '8px', border: '1px solid rgba(0,242,254,0.2)', fontSize: '13px', color: '#00f2fe' }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span>
              Scanning blockchain for your transaction... {attempts > 0 && `(Check #${attempts})`}
            </div>
          )}
          {checkStatus === 'idle' && attempts > 0 && (
            <div style={{ textAlign: 'center', padding: '8px', marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', color: '#888' }}>
              Payment not detected yet. Auto-checking every 30s... (Attempt {attempts})
            </div>
          )}

          {/* Note */}
          <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.5', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
            📌 <strong>Note:</strong> Send exact amount of <strong>${order.price || 0} USD</strong> equivalent in {cryptoLabels[selectedCrypto]}. Payment is automatically verified on the blockchain — no manual confirmation needed.
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button" onClick={startPolling} disabled={checkStatus === 'checking' || !walletAddress}
              style={{
                flex: 1, background: checkStatus === 'checking' ? '#333' : 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)',
                color: '#fff', border: 'none', padding: '12px', borderRadius: '6px',
                fontWeight: 'bold', cursor: checkStatus === 'checking' ? 'not-allowed' : 'pointer',
                opacity: !walletAddress ? 0.6 : 1
              }}
            >
              {checkStatus === 'checking' ? '🔍 Checking...' : attempts > 0 ? '🔄 Check Again' : '✅ I Have Sent Payment'}
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}
