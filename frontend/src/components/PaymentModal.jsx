import React, { useState } from 'react';

export default function PaymentModal({ order, onClose }) {
  const [copied, setCopied] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT_TRC20');

  if (!order) return null;

  const cryptoAddresses = {
    USDT_TRC20: 'TY8z7R9xK4m2P1vN8L5wQ9kJ3yW5uV7a9b',
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    TON: 'EQD1234567890abcdefghijklmnopqrstuvwxyz_TON'
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

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
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#888', fontSize: '22px', cursor: 'pointer' }}
        >
          &times;
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', fontSize: '26px', marginBottom: '10px' }}>
            💳
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '600' }}>Complete Your Payment</h3>
          <span style={{ background: 'linear-gradient(90deg, #00f2fe, #7f00ff)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            Status: {order.status || order.paymentStatus || 'Pending Payment'}
          </span>
        </div>

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

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>Select Payment Currency</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => setSelectedCrypto('USDT_TRC20')}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                background: selectedCrypto === 'USDT_TRC20' ? 'linear-gradient(135deg, #00f2fe, #7f00ff)' : '#282a2c',
                color: '#fff',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              USDT (TRC20)
            </button>
            <button 
              type="button"
              onClick={() => setSelectedCrypto('BTC')}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                background: selectedCrypto === 'BTC' ? 'linear-gradient(135deg, #00f2fe, #7f00ff)' : '#282a2c',
                color: '#fff',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              Bitcoin (BTC)
            </button>
            <button 
              type="button"
              onClick={() => setSelectedCrypto('TON')}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                background: selectedCrypto === 'TON' ? 'linear-gradient(135deg, #00f2fe, #7f00ff)' : '#282a2c',
                color: '#fff',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              TON
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#141617', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #444' }}>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>
            Deposit Address ({selectedCrypto.replace('_', ' ')})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="text" 
              readOnly 
              value={cryptoAddresses[selectedCrypto]} 
              style={{ flex: 1, backgroundColor: '#0c0d0e', border: '1px solid #333', color: '#00f2fe', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => handleCopy(cryptoAddresses[selectedCrypto], selectedCrypto)}
              style={{ background: 'linear-gradient(135deg, #00f2fe, #7f00ff)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              {copied === selectedCrypto ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.5', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
          📌 <strong>Note:</strong> Send exact amount of <strong>${order.price || 0} USD</strong> equivalent. Once payment is processed on the network, an admin will verify and update your order to <em>Processing / Paid</em> status.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            I Have Sent Payment
          </button>
        </div>
      </div>
    </div>
  );
}
