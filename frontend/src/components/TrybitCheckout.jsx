import React, { useState, useEffect, useRef } from 'react';

// Shared Trybit checkout UI.
// Provide either `orderId` (existing unpaid order) or `orderData` (order to be created, then paid).
export default function TrybitCheckout({ apiBase, orderId, orderData, amount, title, onClose, onPaid }) {
  const [phase, setPhase] = useState('idle'); // idle | creating | waiting | paid | error
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [paidOrder, setPaidOrder] = useState(null);
  const currentOrderId = useRef(orderId || null);
  const pollRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original || 'initial';
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const finish = (order) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    setPaidOrder(order);
    setPhase('paid');
    if (onPaid) onPaid(order);
  };

  const poll = async () => {
    try {
      const res = await fetch(`${apiBase}/api/trybit/status/${currentOrderId.current}`);
      const data = await res.json();
      if (data.paid) finish(data.order);
    } catch (_) { /* keep polling */ }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(poll, 5000);
  };

  const handlePay = async () => {
    setError('');
    setPhase('creating');
    // Open the tab synchronously so popup blockers allow it
    const win = window.open('', '_blank');
    try {
      if (!currentOrderId.current) {
        const orderRes = await fetch(`${apiBase}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...orderData, paymentStatus: 'Pending Payment', status: 'Pending Payment' })
        });
        const saved = await orderRes.json();
        if (!orderRes.ok || !saved._id) throw new Error(saved.error || 'Could not create order');
        currentOrderId.current = saved._id;
      }
      const res = await fetch(`${apiBase}/api/trybit/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrderId.current })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create payment');
      if (data.paid) { if (win) win.close(); return finish(data.order); }
      setLink(data.link);
      if (win) win.location.href = data.link; else window.location.href = data.link;
      setPhase('waiting');
      startPolling();
    } catch (e) {
      if (win) win.close();
      setError(e.message || 'Something went wrong');
      setPhase('error');
    }
  };

  const price = amount ?? orderData?.price ?? 0;
  const busy = phase === 'creating';

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 10, 0.88)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px', overflow: 'hidden'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #161a22 0%, #0e1014 100%)',
        border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '20px',
        width: '100%', maxWidth: '440px', padding: '22px 20px', color: '#fff',
        boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative'
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px',
          borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', fontSize: '16px',
          cursor: 'pointer', outline: 'none'
        }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '16px', paddingRight: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '50%', fontSize: '22px', marginBottom: '8px',
            background: phase === 'paid'
              ? 'linear-gradient(135deg, rgba(72,164,100,0.3), rgba(0,242,254,0.2))'
              : 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(127,0,255,0.3))',
            border: phase === 'paid' ? '1px solid #48a464' : '1px solid #00f2fe'
          }}>{phase === 'paid' ? '✅' : '💳'}</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700 }}>
            {phase === 'paid' ? 'Payment Confirmed!' : 'Pay with Crypto'}
          </h3>
          <span style={{
            background: phase === 'paid' ? 'linear-gradient(90deg,#48a464,#00f2fe)' : 'linear-gradient(90deg,#00f2fe,#7f00ff)',
            padding: '3px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase'
          }}>{phase === 'paid' ? '✔ Paid' : phase === 'waiting' ? 'Waiting for payment' : 'Secure checkout'}</span>
        </div>

        {phase === 'paid' ? (
          <div style={{
            backgroundColor: 'rgba(72,164,100,0.12)', border: '1px solid #48a464',
            borderRadius: '14px', padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '15px', color: '#48a464', fontWeight: 700, marginBottom: '6px' }}>🎉 Payment received</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '12px' }}>Your order has been placed and is now in progress.</div>
            {paidOrder?.txHash && (
              <div style={{ fontSize: '10px', color: '#888', background: '#0a0b0d', padding: '8px 10px', borderRadius: '8px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '12px' }}>
                TX: {paidOrder.txHash}
              </div>
            )}
            <button onClick={onClose} style={{ width: '100%', background: 'linear-gradient(135deg,#00f2fe,#7f00ff)', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
              Done &amp; Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px' }}>
              {title && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#8a94a6' }}>Order:</span>
                  <span style={{ fontWeight: 600, color: '#e1e7ef' }}>{title}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Amount Due:</span>
                <span style={{ color: '#00f2fe', fontSize: '18px', fontWeight: 800 }}>${price} USD</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#8a94a6', lineHeight: 1.5, marginBottom: '14px', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #00f2fe', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              📌 You'll choose your coin (USDT, BTC, ETH, LTC, SOL, TON and more) on the secure Trybit page. This window updates automatically once your payment is confirmed.
            </div>

            {phase === 'waiting' && (
              <div style={{ textAlign: 'center', padding: '10px', marginBottom: '12px', backgroundColor: 'rgba(0,242,254,0.08)', borderRadius: '10px', border: '1px solid rgba(0,242,254,0.3)', fontSize: '12px', color: '#00f2fe', fontWeight: 600 }}>
                ⏳ Waiting for your payment... checking automatically
              </div>
            )}
            {phase === 'error' && (
              <div style={{ textAlign: 'center', padding: '10px', marginBottom: '12px', backgroundColor: 'rgba(217,83,79,0.12)', borderRadius: '10px', border: '1px solid #d9534f', fontSize: '12px', color: '#ff8a86' }}>
                {error}
              </div>
            )}

            <button type="button" onClick={handlePay} disabled={busy} style={{
              width: '100%', background: busy ? '#262b36' : 'linear-gradient(135deg,#00f2fe 0%,#7f00ff 100%)',
              color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', fontWeight: 800, fontSize: '14px',
              cursor: busy ? 'not-allowed' : 'pointer', boxShadow: '0 6px 18px rgba(0,242,254,0.25)'
            }}>
              {busy ? 'Preparing payment...' : phase === 'waiting' ? '🔗 Reopen Payment Page' : phase === 'error' ? '🔄 Try Again' : '🚀 Pay Now'}
            </button>
            {phase === 'waiting' && link && (
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px' }}>
                <a href={link} target="_blank" rel="noreferrer" style={{ color: '#00f2fe' }}>Open payment link manually</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
