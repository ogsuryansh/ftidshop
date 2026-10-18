import React from 'react';

// ─── Pre-Payment Modal (verifies blockchain BEFORE saving order) ────────────
function PrePaymentModal({ orderData, apiBase, onClose, onPaymentConfirmed }) {
  const [enabledCoins, setEnabledCoins] = React.useState(['TELEGRAM_STARS', 'BTC', 'LTC']);
  const [selectedCrypto, setSelectedCrypto] = React.useState('TELEGRAM_STARS');
  const [walletAddress, setWalletAddress] = React.useState('');
  const [checkStatus, setCheckStatus] = React.useState('idle'); // idle | checking | confirmed | failed
  const [attempts, setAttempts] = React.useState(0);
  const [txHash, setTxHash] = React.useState('');
  const [copied, setCopied] = React.useState('');
  const [showQR, setShowQR] = React.useState(false);
  const [cryptoRate, setCryptoRate] = React.useState(null);
  const [cryptoAmount, setCryptoAmount] = React.useState(null);
  const [starsInvoice, setStarsInvoice] = React.useState(null);
  const [loadingStars, setLoadingStars] = React.useState(false);
  const [starsError, setStarsError] = React.useState('');
  const [telegramOrderId, setTelegramOrderId] = React.useState(null);
  const pollRef = React.useRef(null);
  const isCheckingRef = React.useRef(false);

  const defaultAddresses = {
    BTC: '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ',
    LTC: 'ltc1qd909zrrfr7s4ys0zt8rlcxjvu9j5p3w6rpjcwa',
    USDT_TRC20: 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR',
    SOL: '6SthbfqV4pG7Gs74cZwVv6n4vtuKPWk3ByRNABk71Az3',
    ETH: '0x54defcf541d174e7443c1ada58875e3e04ca5178',
    TON: 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM'
  };

  const cryptoLabels = { TELEGRAM_STARS: 'Telegram Stars (⭐ XTR)', BTC: 'Bitcoin (BTC)', LTC: 'Litecoin (LTC)', USDT_TRC20: 'USDT (TRC20)', SOL: 'Solana (SOL)', ETH: 'Ethereum (ETH)', TON: 'TON' };
  const cryptoIcons = { TELEGRAM_STARS: '⭐', BTC: '₿', LTC: 'Ł', USDT_TRC20: '₮', SOL: '◎', ETH: 'Ξ', TON: '💎' };

  const formatCrypto = (amountUSD, priceUSD, currency) => {
    if (!priceUSD || priceUSD <= 0 || !amountUSD) return null;
    const raw = Number(amountUSD) / Number(priceUSD);
    switch (currency) {
      case 'BTC': return Number(raw.toFixed(6));
      case 'LTC': return Number(raw.toFixed(4));
      case 'ETH': return Number(raw.toFixed(5));
      case 'SOL': return Number(raw.toFixed(4));
      case 'TON': return Number(raw.toFixed(4));
      case 'USDT_TRC20':
      default: return Number(Number(amountUSD).toFixed(2));
    }
  };

  // Fetch enabled coins from settings
  React.useEffect(() => {
    fetch(`${apiBase}/api/settings`)
      .then(r => r.json())
      .then(s => {
        if (s) {
          const list = [];
          if (s.enableTelegramStars !== false) list.push('TELEGRAM_STARS');
          if (s.enableBTC !== false) list.push('BTC');
          if (s.enableLTC !== false) list.push('LTC');
          if (s.enableUSDT_TRC20) list.push('USDT_TRC20');
          if (s.enableSOL) list.push('SOL');
          if (s.enableETH) list.push('ETH');
          if (s.enableTON) list.push('TON');
          if (list.length > 0) {
            setEnabledCoins(list);
            setSelectedCrypto(prev => list.includes(prev) ? prev : (list.includes('TELEGRAM_STARS') ? 'TELEGRAM_STARS' : list[0]));
          }
        }
      })
      .catch(() => {});
  }, [apiBase]);

  // Fetch real wallet address and live rate from backend when crypto changes
  React.useEffect(() => {
    setCheckStatus('idle');

    if (selectedCrypto === 'TELEGRAM_STARS') {
      setWalletAddress('');
      setLoadingStars(true);
      setStarsError('');

      // Create pending order and request Stars invoice
      const initStarsPayment = async () => {
        try {
          let currentId = telegramOrderId;
          if (!currentId) {
            const orderRes = await fetch(`${apiBase}/api/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...orderData,
                paymentStatus: 'Pending Payment',
                status: 'Pending Payment',
                paymentCurrency: 'TELEGRAM_STARS'
              })
            });
            const created = await orderRes.json();
            if (!created || !created._id) {
              setLoadingStars(false);
              setStarsError('Could not initialize Telegram Stars order');
              return;
            }
            currentId = created._id;
            setTelegramOrderId(currentId);
          }

          const invRes = await fetch(`${apiBase}/api/payment/telegram-stars-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: currentId })
          });
          const invData = await invRes.json();
          setLoadingStars(false);
          if (invData.success && invData.invoiceLink) {
            setStarsInvoice(invData);
            setCryptoAmount(invData.starsAmount);
          } else if (invData.paid) {
            setCheckStatus('confirmed');
            if (onPaymentConfirmed) onPaymentConfirmed(invData.order);
          } else {
            setStarsError(invData.error || 'Failed to generate Stars invoice');
          }
        } catch (err) {
          setLoadingStars(false);
          setStarsError('Network error initializing Telegram Stars');
        }
      };

      initStarsPayment();

      // Start real-time status polling every 3.5s
      const poller = setInterval(() => {
        if (!telegramOrderId) return;
        fetch(`${apiBase}/api/payment-status/${telegramOrderId}`)
          .then(r => r.json())
          .then(st => {
            if (st && (st.paymentStatus === 'Paid' || st.status === 'Completed')) {
              clearInterval(poller);
              setCheckStatus('confirmed');
              setTxHash(st.txHash || '');
              if (onPaymentConfirmed) onPaymentConfirmed(st);
            }
          })
          .catch(() => {});
      }, 3500);

      return () => clearInterval(poller);
    }

    setWalletAddress(defaultAddresses[selectedCrypto] || '');

    fetch(`${apiBase}/api/payment/address/${selectedCrypto}`)
      .then(r => r.json())
      .then(d => { if (d.address) setWalletAddress(d.address); })
      .catch(() => {});

    if (orderData && orderData.price) {
      fetch(`${apiBase}/api/payment/rate/${selectedCrypto}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.priceUSD) {
            setCryptoRate(data.priceUSD);
            const formatted = formatCrypto(orderData.price, data.priceUSD, selectedCrypto);
            setCryptoAmount(formatted);
          }
        })
        .catch(() => {});
    }
  }, [selectedCrypto, apiBase, orderData?.price, telegramOrderId, onPaymentConfirmed]);

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
      if (selectedCrypto === 'TELEGRAM_STARS' && telegramOrderId) {
        const stRes = await fetch(`${apiBase}/api/payment-status/${telegramOrderId}`);
        const stData = await stRes.json();
        setAttempts(a => a + 1);
        if (stData && (stData.paymentStatus === 'Paid' || stData.status === 'Completed')) {
          setCheckStatus('confirmed');
          setTxHash(stData.txHash || '');
          if (pollRef.current) clearInterval(pollRef.current);
          if (onPaymentConfirmed) onPaymentConfirmed(stData);
        } else {
          setCheckStatus('idle');
        }
        return;
      }

      // Check blockchain WITHOUT saving order yet
      const res = await fetch(`${apiBase}/api/verify-payment/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: selectedCrypto,
          address: displayAddress,
          amount: orderData.price,
          expectedCrypto: cryptoAmount
        })
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
            expectedCrypto: cryptoAmount,
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
  }, [selectedCrypto, displayAddress, orderData, checkStatus, apiBase, onPaymentConfirmed, cryptoAmount, telegramOrderId]);

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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#00f2fe', fontSize: '18px', fontWeight: '800' }}>
                    ${Number(orderData.price || 0) < 0.01 ? Number(orderData.price || 0).toFixed(4) : Number(orderData.price || 0).toFixed(2)} USD
                  </div>
                  {selectedCrypto === 'TELEGRAM_STARS' ? (
                    <div style={{ color: '#ffd700', fontSize: '12px', fontWeight: '800', marginTop: '2px' }}>
                      ≈ {(starsInvoice?.starsAmount || Math.max(1, Math.round((orderData.price || 0.01) * 90))).toLocaleString()} Stars
                    </div>
                  ) : cryptoAmount ? (
                    <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: '700', marginTop: '2px' }}>
                      ≈ {cryptoAmount} {selectedCrypto}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Crypto select */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8a94a6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Method
              </label>

              {/* Quick Select Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                {enabledCoins.map(coinKey => {
                  const isSelected = selectedCrypto === coinKey;
                  const isStars = coinKey === 'TELEGRAM_STARS';
                  return (
                    <button
                      key={coinKey}
                      type="button"
                      onClick={() => setSelectedCrypto(coinKey)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: isSelected
                          ? (isStars ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(0, 136, 204, 0.35))' : 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(127, 0, 255, 0.25))')
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected
                          ? (isStars ? '2px solid #ffd700' : '2px solid #00f2fe')
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? (isStars ? '#ffd700' : '#00f2fe') : '#aaa',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        fontWeight: '700', fontSize: isStars ? '12px' : '11px',
                        boxShadow: isSelected ? (isStars ? '0 0 15px rgba(255, 215, 0, 0.3)' : '0 0 15px rgba(0, 242, 254, 0.25)') : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{cryptoIcons[coinKey]}</span>
                      <span>{isStars ? 'Telegram Stars' : (coinKey === 'USDT_TRC20' ? 'USDT' : coinKey)}</span>
                    </button>
                  );
                })}
              </div>

              <select
                value={selectedCrypto}
                onChange={e => setSelectedCrypto(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1a1e26',
                  color: '#fff', border: '1px solid rgba(0,242,254,0.4)', fontSize: '13px', fontWeight: '700',
                  outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                }}
              >
                {enabledCoins.map(k => (
                  <option key={k} value={k} style={{ backgroundColor: '#161a22', color: '#fff' }}>
                    {cryptoIcons[k]} {cryptoLabels[k]}
                  </option>
                ))}
              </select>
            </div>

            {selectedCrypto === 'TELEGRAM_STARS' ? (
              /* Telegram Stars Payment View */
              <div style={{
                backgroundColor: '#0c0f17',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '14px', padding: '16px', marginBottom: '12px',
                boxShadow: '0 6px 25px rgba(255, 215, 0, 0.12)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '54px', height: '54px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(0, 136, 204, 0.35))',
                    border: '1px solid #ffd700', fontSize: '28px', marginBottom: '8px',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                  }}>
                    ⭐
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Telegram Stars (XTR) Invoice
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', margin: '4px 0', textShadow: '0 0 15px rgba(255, 215, 0, 0.5)' }}>
                    {(starsInvoice?.starsAmount || Math.max(1, Math.round((orderData.price || 0.01) * 90))).toLocaleString()} Stars
                  </div>
                  <div style={{ fontSize: '12px', color: '#8a94a6' }}>
                    ≈ ${Number(orderData.price || 0) < 0.01 ? Number(orderData.price || 0).toFixed(4) : Number(orderData.price || 0).toFixed(2)} USD • Rate: {starsInvoice?.starsRate || 90} Stars = $1.00 USD
                  </div>
                </div>

                {loadingStars ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#ffd700', fontSize: '13px' }}>
                    <span style={{ display: 'inline-block', animation: 'spinSlow 1.5s linear infinite', marginRight: '8px' }}>⏳</span>
                    Generating secure Telegram Stars payment link...
                  </div>
                ) : starsError ? (
                  <div style={{ backgroundColor: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', borderRadius: '8px', padding: '10px', color: '#ff4d4d', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
                    ⚠️ {starsError}
                  </div>
                ) : (
                  <>
                    {/* 1-Tap Pay on Telegram Button */}
                    <a
                      href={starsInvoice?.invoiceLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #0088cc 100%)',
                        color: '#000000', textDecoration: 'none',
                        padding: '14px', borderRadius: '10px', fontWeight: '900', fontSize: '15px',
                        letterSpacing: '0.3px', textAlign: 'center',
                        boxShadow: '0 8px 25px rgba(255, 215, 0, 0.35)',
                        boxSizing: 'border-box', marginBottom: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>⭐</span> Pay {starsInvoice ? starsInvoice.starsAmount : ''} Stars on Telegram <span>➔</span>
                    </a>

                    {/* Copy Link Field */}
                    {starsInvoice?.invoiceLink && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="text"
                          readOnly
                          value={starsInvoice.invoiceLink}
                          style={{
                            flex: 1, backgroundColor: '#141820', border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px', padding: '10px', color: '#00f2fe',
                            fontSize: '11px', outline: 'none', fontFamily: 'monospace'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(starsInvoice.invoiceLink, 'starsLink')}
                          style={{
                            padding: '10px 14px',
                            background: copied === 'starsLink'
                              ? 'linear-gradient(135deg, #48a464, #2e7d32)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {copied === 'starsLink' ? '✔ Copied' : '📋 Copy Link'}
                        </button>
                      </div>
                    )}

                    {/* Auto-confirmation pulse indicator */}
                    <div style={{
                      textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255, 215, 0, 0.06)',
                      border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: '10px',
                      fontSize: '11px', color: '#ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffd700', display: 'inline-block', boxShadow: '0 0 10px #ffd700' }}></span>
                      <span>Waiting for payment in Telegram... Auto-confirms instantly</span>
                    </div>

                    {/* Manual Check CTA Button */}
                    <button
                      type="button"
                      onClick={checkPayment}
                      disabled={checkStatus === 'checking'}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)',
                        color: '#ffffff', border: 'none', padding: '12px',
                        borderRadius: '10px', fontWeight: '800', fontSize: '13px',
                        cursor: checkStatus === 'checking' ? 'not-allowed' : 'pointer',
                        opacity: checkStatus === 'checking' ? 0.7 : 1,
                        outline: 'none'
                      }}
                    >
                      {checkStatus === 'checking' ? '⏳ Verifying...' : '🔄 Check Status Now'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Standard Crypto View */
              <>
                {/* Exact Amount To Send Box with 1-Click Copy */}
                <div style={{
                  backgroundColor: '#0a0c10',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px', padding: '12px', marginBottom: '12px',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Exact Amount to Send ({selectedCrypto})
                    </span>
                    {copied === 'amount' && (
                      <span style={{ fontSize: '10px', color: '#48a464', fontWeight: '700' }}>
                        ✓ Amount Copied!
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                      flex: 1, backgroundColor: '#141820', border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px', padding: '10px', color: '#4ade80',
                      fontFamily: 'monospace', fontSize: '15px', fontWeight: '800', textAlign: 'center',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)', userSelect: 'all'
                    }}>
                      {cryptoAmount ? `${cryptoAmount} ${selectedCrypto}` : `$${Number(orderData.price).toFixed(2)} USD`}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(cryptoAmount ? cryptoAmount.toString() : Number(orderData.price).toFixed(2), 'amount')}
                      style={{
                        padding: '10px 14px',
                        background: copied === 'amount'
                          ? 'linear-gradient(135deg, #48a464, #2e7d32)'
                          : 'linear-gradient(135deg, #00f2fe, #7f00ff)',
                        color: '#ffffff', border: 'none', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '700', fontSize: '12px',
                        display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                      }}
                    >
                      {copied === 'amount' ? '✔ Copied' : '📋 Copy Amount'}
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '10px', color: '#8a94a6', marginTop: '6px', textAlign: 'center' }}>
                    💡 Send exact amount above. Small random cents guarantee instant, 100% automated matching.
                  </div>
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
                  📌 Send exact amount of <strong>{cryptoAmount ? `${cryptoAmount} ${selectedCrypto}` : `$${Number(orderData.price).toFixed(2)} USD`}</strong> (${Number(orderData.price).toFixed(2)} USD). Your order will be placed automatically after blockchain confirms.
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
          </>
        )}
      </div>
    </div>
  );
}

export default PrePaymentModal;
