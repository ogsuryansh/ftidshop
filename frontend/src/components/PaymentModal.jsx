import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';

export default function PaymentModal({ order, onClose, onPaymentConfirmed }) {
  const [copied, setCopied] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT_TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [checkStatus, setCheckStatus] = useState('idle'); // idle | checking | confirmed | failed
  const [txHash, setTxHash] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showQR, setShowQR] = useState(true);
  const pollRef = useRef(null);

  if (!order) return null;

  // Default fallback wallet addresses
  const defaultAddresses = {
    USDT_TRC20: 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR',
    BTC: '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ',
    LTC: 'Lhkby8mb1DgZfVsQWrSopScTeNf252qi9Q',
    SOL: 'AigcpMzqZw9asMFVSdNi8T4MAHHujykEUdyUjTH9F6JG',
    ETH: '0x54defcf541d174e7443c1ada58875e3e04ca5178',
    TON: 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM'
  };

  // Fetch real wallet address from backend
  useEffect(() => {
    setWalletAddress(defaultAddresses[selectedCrypto] || '');
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2500);
  };

  const displayAddress = walletAddress || defaultAddresses[selectedCrypto] || '';

  const cryptoLabels = {
    USDT_TRC20: 'USDT (TRC20)',
    BTC: 'Bitcoin (BTC)',
    LTC: 'Litecoin (LTC)',
    SOL: 'Solana (SOL)',
    ETH: 'Ethereum (ETH)',
    TON: 'TON'
  };

  const cryptoIcons = {
    USDT_TRC20: '₮',
    BTC: '₿',
    LTC: 'Ł',
    SOL: '◎',
    ETH: 'Ξ',
    TON: '💎'
  };

  const qrCodeUrl = displayAddress 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(displayAddress)}`
    : '';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(5, 7, 10, 0.88)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px', overflowY: 'auto'
    }}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 15px rgba(0, 242, 254, 0.2); }
          50% { box-shadow: 0 0 30px rgba(0, 242, 254, 0.45); }
          100% { box-shadow: 0 0 15px rgba(0, 242, 254, 0.2); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        backgroundColor: '#12151a',
        background: 'linear-gradient(145deg, #161a22 0%, #0e1014 100%)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '20px',
        width: '100%', maxWidth: '480px',
        padding: '24px 20px',
        color: '#ffffff',
        boxSizing: 'border-box',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        animation: 'pulseGlow 4s infinite ease-in-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#aaa', fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#aaa'; }}
        >
          ✕
        </button>

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '50%',
            background: checkStatus === 'confirmed'
              ? 'linear-gradient(135deg, rgba(72,164,100,0.3), rgba(0,242,254,0.2))'
              : 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(127,0,255,0.3))',
            border: checkStatus === 'confirmed' ? '1px solid #48a464' : '1px solid #00f2fe',
            fontSize: '26px', marginBottom: '12px'
          }}>
            {checkStatus === 'confirmed' ? '✅' : '💳'}
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '21px', fontWeight: '700', letterSpacing: '-0.3px', color: '#fff' }}>
            {checkStatus === 'confirmed' ? 'Payment Verified!' : 'Complete Payment'}
          </h3>
          <span style={{
            background: checkStatus === 'confirmed'
              ? 'linear-gradient(90deg, #48a464, #00f2fe)'
              : 'linear-gradient(90deg, #00f2fe, #7f00ff)',
            color: '#ffffff', padding: '4px 14px', borderRadius: '20px',
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase'
          }}>
            {checkStatus === 'confirmed' ? '✔ Paid' : (order.paymentStatus || 'Pending Payment')}
          </span>
        </div>

        {/* Confirmed view */}
        {checkStatus === 'confirmed' && (
          <div style={{
            backgroundColor: 'rgba(72,164,100,0.12)',
            border: '1px solid #48a464', borderRadius: '14px',
            padding: '20px', marginBottom: '10px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#48a464', fontWeight: '700', marginBottom: '6px' }}>
              🎉 Payment Confirmed on Blockchain!
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '12px' }}>
              Your order has been updated and is now in progress.
            </div>
            {txHash && (
              <div style={{
                fontSize: '11px', color: '#888', background: '#0a0b0d',
                padding: '8px 12px', borderRadius: '8px', fontFamily: 'monospace',
                wordBreak: 'break-all', marginBottom: '15px'
              }}>
                TX Hash: {txHash}
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #00f2fe, #7f00ff)',
                color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer'
              }}
            >
              Done & Close
            </button>
          </div>
        )}

        {/* Payment Flow */}
        {checkStatus !== 'confirmed' && (
          <>
            {/* Summary Box */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px', padding: '14px 16px', marginBottom: '18px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#8a94a6' }}>Order:</span>
                <span style={{ fontWeight: '600', color: '#e1e7ef', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {order.name || order.type || 'Service Order'}
                </span>
              </div>
              {order.trackingNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#8a94a6' }}>Tracking:</span>
                  <span style={{ fontFamily: 'monospace', color: '#00f2fe', fontWeight: '600' }}>{order.trackingNumber}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', marginTop: '8px'
              }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>Amount Due:</span>
                <span style={{
                  color: '#00f2fe', fontSize: '20px', fontWeight: '800',
                  textShadow: '0 0 12px rgba(0,242,254,0.4)'
                }}>
                  ${order.price || 0} USD
                </span>
              </div>
            </div>

            {/* Currency Select */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Payment Coin
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedCrypto}
                  onChange={(e) => handleCryptoSelect(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    backgroundColor: '#1a1e26', color: '#ffffff',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    fontSize: '14px', fontWeight: '700', outline: 'none',
                    cursor: 'pointer', boxSizing: 'border-box',
                    appearance: 'none', WebkitAppearance: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}
                >
                  {Object.keys(cryptoLabels).map(coinKey => (
                    <option key={coinKey} value={coinKey} style={{ backgroundColor: '#161a22', color: '#fff' }}>
                      {cryptoIcons[coinKey]} {cryptoLabels[coinKey]}
                    </option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#00f2fe', fontSize: '12px' }}>
                  ▼
                </div>
              </div>
            </div>

            {/* QR Code toggle / view */}
            {qrCodeUrl && (
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  style={{
                    background: 'transparent', border: 'none', color: '#00f2fe',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    textDecoration: 'underline', padding: '4px', outline: 'none'
                  }}
                >
                  {showQR ? 'Hide QR Code' : '📷 Show QR Code'}
                </button>
                {showQR && (
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      background: '#ffffff', padding: '10px', borderRadius: '14px',
                      boxShadow: '0 8px 25px rgba(0, 242, 254, 0.2)'
                    }}>
                      <img
                        src={qrCodeUrl}
                        alt="Deposit Address QR Code"
                        style={{ width: '150px', height: '150px', display: 'block' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deposit Address Box (Mobile Responsive - No Horizontal Overflow) */}
            <div style={{
              backgroundColor: '#0a0c10',
              border: '1px dashed rgba(0, 242, 254, 0.35)',
              borderRadius: '14px', padding: '14px', marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Deposit Address ({selectedCrypto})
                </span>
                {copied === selectedCrypto && (
                  <span style={{ fontSize: '11px', color: '#48a464', fontWeight: '700' }}>
                    ✓ Copied to clipboard
                  </span>
                )}
              </div>

              {/* Address display box with word-break */}
              <div style={{
                backgroundColor: '#141820',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px', padding: '12px',
                color: '#00f2fe', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-all',
                marginBottom: '10px', userSelect: 'all', textAlign: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {displayAddress || 'Loading wallet address...'}
              </div>

              {/* Action Copy Button */}
              <button
                type="button"
                onClick={() => handleCopy(displayAddress, selectedCrypto)}
                style={{
                  width: '100%',
                  background: copied === selectedCrypto
                    ? 'linear-gradient(135deg, #48a464, #2e7d32)'
                    : 'linear-gradient(135deg, #00f2fe, #7f00ff)',
                  color: '#ffffff', border: 'none', padding: '12px',
                  borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.2)',
                  transition: 'all 0.2s ease', outline: 'none'
                }}
              >
                {copied === selectedCrypto ? '✔ Address Copied!' : '📋 Copy Deposit Address'}
              </button>
            </div>

            {/* Checking Status banner */}
            {checkStatus === 'checking' && (
              <div style={{
                textAlign: 'center', padding: '12px', marginBottom: '16px',
                backgroundColor: 'rgba(0, 242, 254, 0.08)', borderRadius: '12px',
                border: '1px solid rgba(0, 242, 254, 0.3)', fontSize: '13px', color: '#00f2fe',
                fontWeight: '600'
              }}>
                <span style={{ display: 'inline-block', animation: 'spinSlow 1.5s linear infinite', marginRight: '8px' }}>⏳</span>
                Scanning blockchain for your transfer... {attempts > 0 && `(Check #${attempts})`}
              </div>
            )}
            {checkStatus === 'idle' && attempts > 0 && (
              <div style={{
                textAlign: 'center', padding: '10px', marginBottom: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px',
                fontSize: '12px', color: '#8a94a6'
              }}>
                Payment not detected yet. Auto-checking every 30s... (Check #{attempts})
              </div>
            )}

            {/* Helper Note */}
            <div style={{
              fontSize: '11px', color: '#8a94a6', lineHeight: '1.5',
              marginBottom: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)',
              padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #00f2fe'
            }}>
              📌 Send exact amount of <strong>${order.price || 0} USD</strong> equivalent in {cryptoLabels[selectedCrypto]}. On-chain confirmation is automatically verified.
            </div>

            {/* Check Payment CTA Button */}
            <button
              type="button"
              onClick={startPolling}
              disabled={checkStatus === 'checking' || !displayAddress}
              style={{
                width: '100%',
                background: checkStatus === 'checking'
                  ? '#262b36'
                  : 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)',
                color: '#ffffff', border: 'none', padding: '15px',
                borderRadius: '12px', fontWeight: '800', fontSize: '15px',
                letterSpacing: '0.3px',
                cursor: checkStatus === 'checking' ? 'not-allowed' : 'pointer',
                opacity: !displayAddress ? 0.6 : 1,
                boxShadow: '0 6px 20px rgba(0, 242, 254, 0.25)',
                transition: 'all 0.2s ease', outline: 'none'
              }}
            >
              {checkStatus === 'checking' ? '🔍 Scanning Blockchain...' : attempts > 0 ? '🔄 Check Again Now' : '✅ I Have Sent Payment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
