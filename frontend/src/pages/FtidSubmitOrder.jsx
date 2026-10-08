import React, { useState, useEffect } from 'react';
import PaymentModal from '../components/PaymentModal';
import API_BASE_URL from '../config';

function safeParseUser(raw) {
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function FtidSubmitOrder() {
  const [country, setCountry] = useState('United States US');
  const [courier, setCourier] = useState('UPS');
  const [method, setMethod] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [fileData, setFileData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTransition, setLoadingTransition] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [activeDesc, setActiveDesc] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Crypto');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [pendingOrderData, setPendingOrderData] = useState(null); // holds order data before payment confirmed

  const user = safeParseUser(localStorage.getItem('user'));

  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data);
        }
      })
      .catch(err => console.error("Error loading products:", err));
  }, []);

  // Default fallback configuration for Couriers & Methods per Country
  const defaultCountryConfigs = {
    'Insider Scans "Only tracking needed"': {
      couriers: ['UPS', 'FedEx', 'USPS'],
      methods: [
        { name: 'Rts insider city/any state', price: 70, desc: 'RTS Insider scan update for any city or state.', badge: null, courier: 'UPS' },
        { name: 'Ap lit ups any city', price: 25, desc: 'AP LIT UPS scan update for any city.', badge: 'Click to read description', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'Fedex driver lit', price: 80, desc: 'FedEx Driver Lost In Transit scan update.', badge: null, courier: 'FedEx' },
        { name: 'ap lit worldwide', price: 25, desc: 'Worldwide Access Point LIT service for international tracking.', badge: 'Click to read description', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'manual rts', price: 35, desc: 'Manual Return To Sender scan service.', badge: null, courier: 'UPS' }
      ]
    },
    'United States US': {
      couriers: ['UPS', 'FedEx', 'USPS'],
      methods: [
        { name: 'Cali LIT (Very Limited)', price: 45, desc: 'Specialized Lost In Transit method for California region shipments with high success rate.', badge: 'Click to read description', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'UPS UTD (must be in transit = yes)', price: 60, desc: 'Unable To Deliver scan update for active UPS packages currently in transit.', badge: null, courier: 'UPS' },
        { name: 'UPS RTS', price: 60, desc: 'Return To Sender scan process for UPS packages.', badge: null, courier: 'UPS' },
        { name: 'UPS LIT Store', price: 45, desc: 'Lost In Transit method performed via physical UPS Store dropoffs.', badge: 'Click to read description', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'AP LIT WORLDWIDE', price: 30, desc: 'Worldwide Access Point LIT service for international UPS tracking.', badge: 'Click to read description', badgeColor: '#d9534f', courier: 'UPS' }
      ]
    },
    'Canada CA': {
      couriers: ['Canada Post', 'Purolator', 'UPS', 'FedEx', 'DHL'],
      methods: [
        { name: 'FTIDV3', price: 20, desc: 'FTID Version 3 processing. High speed delivery status update.', badge: 'Label is required', badgeColor: '#4caf50', courier: 'Canada Post' },
        { name: 'LIT', price: 35, desc: 'Lost in Transit scan update for Canadian courier shipments.', badge: 'Label is required', badgeColor: '#4caf50', courier: 'Canada Post' },
        { name: 'FTIDNA', price: 35, desc: 'FTID No Access / No Arrival update for Canadian carriers.', badge: 'Label is required', badgeColor: '#4caf50', courier: 'Canada Post' }
      ]
    },
    'Germany DE': {
      couriers: ['DHL', 'DPD', 'GLS', 'UPS', 'Hermes', 'DHL Express'],
      methods: [
        { name: 'FTIDV3', price: 25, desc: 'FTID Version 3 processing for EU / Germany shipments.', badge: 'Label is required', badgeColor: '#4caf50', courier: 'DHL' },
        { name: 'LIT', price: 40, desc: 'Lost in Transit scan update for German couriers.', badge: 'Label is required', badgeColor: '#4caf50', courier: 'DHL' },
        { name: 'FTIDNA', price: 40, desc: 'FTID No Arrival update for European carriers.', badge: 'Label is required', badgeColor: '#4caf50', courier: 'DHL' }
      ]
    }
  };

  const countryConfigs = React.useMemo(() => {
    const configs = {};
    
    if (dbProducts.length === 0) {
      Object.keys(defaultCountryConfigs).forEach(cat => {
        configs[cat] = {
          couriers: [...defaultCountryConfigs[cat].couriers],
          methods: [...defaultCountryConfigs[cat].methods]
        };
      });
      return configs;
    }

    dbProducts.forEach(item => {
      if (!configs[item.category]) {
        configs[item.category] = { couriers: [], methods: [] };
      }
      const courierName = item.courier || 'Any';
      if (!configs[item.category].couriers.includes(courierName)) {
        configs[item.category].couriers.push(courierName);
      }
      configs[item.category].methods.push({
        name: item.name,
        price: item.price,
        desc: item.desc,
        badge: item.badge,
        badgeColor: item.badgeColor,
        courier: courierName
      });
    });
    return configs;
  }, [dbProducts]);

  const currentConfig = countryConfigs[country] || Object.values(countryConfigs)[0] || { couriers: [], methods: [] };
  const availableMethods = currentConfig.methods ? currentConfig.methods.filter(m => m.courier === 'Any' || m.courier === courier) : [];

  // Automatically select first courier and method when country changes
  useEffect(() => {
    if (currentConfig && currentConfig.couriers.length > 0) {
      if (!currentConfig.couriers.includes(courier)) {
        setCourier(currentConfig.couriers[0]);
      }
    }
  }, [country, currentConfig]);

  useEffect(() => {
    if (availableMethods.length > 0) {
      if (!availableMethods.some(m => m.name === method)) {
        setMethod(availableMethods[0].name);
      }
    }
  }, [courier, availableMethods]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          filename: file.name,
          data: reader.result,
          mimeType: file.type
        });
        reader.readAsDataURL(file);
      });
    }));

    setFileData(prev => prev && prev.length ? [...prev, ...newFiles] : [...newFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!user) {
      alert("Please log in to submit an order.");
      return;
    }

    const selectedMethodObj = currentConfig.methods.find(m => m.name === method);
    const trackingCount = trackingNumber.split('\n').filter(t => t.trim()).length;
    const fileCount = fileData ? fileData.length : 0;
    const quantity = Math.max(trackingCount, fileCount, 1);
    const price = (selectedMethodObj ? selectedMethodObj.price : 30) * quantity;

    // For Wallet Balance: place order immediately (backend deducts credits)
    if (paymentMethod === 'Wallet Balance') {
      setSubmitting(true);
      setLoadingTransition(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id || user.id,
            type: 'FTID', country, courier, method, trackingNumber, note, fileData, price,
            status: 'Pending',
            paymentStatus: 'Paid',
            paymentMethod: 'Wallet Balance'
          })
        });
        const data = await res.json();
        setTimeout(() => {
          setSubmitting(false);
          setLoadingTransition(false);
          if (res.ok) {
            const updatedUser = { ...user, credits: user.credits - price };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setOrderSuccessMsg('Order paid successfully using Wallet Balance!');
            setTimeout(() => setOrderSuccessMsg(''), 3000);
            setTrackingNumber(''); setNote(''); setFileData(null);
          } else {
            alert(data.error || 'Failed to create order.');
          }
        }, 1200);
      } catch (err) {
        console.error(err);
        setSubmitting(false);
        setLoadingTransition(false);
        alert('Error submitting order.');
      }
      return;
    }

    // For Crypto: store order data in state and open payment modal (do NOT save to DB yet)
    setPendingOrderData({
      userId: user._id || user.id,
      type: 'FTID', country, courier, method, trackingNumber, note, fileData, price,
      paymentMethod: 'Crypto'
    });
  };

  const selectedMethodObjForRender = currentConfig.methods.find(m => m.name === method);
  const currentTrackingCount = trackingNumber.split('\n').filter(t => t.trim()).length;
  const currentFileCount = fileData ? fileData.length : 0;
  const currentQuantity = Math.max(currentTrackingCount, currentFileCount, 1);
  const currentTotalPrice = (selectedMethodObjForRender ? selectedMethodObjForRender.price : 30) * currentQuantity;

  return (
    <div style={{ padding: '20px 0', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>New order</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Country Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Country / Category</label>
          <select 
            value={country} 
            onChange={e => setCountry(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
          >
            {Object.keys(countryConfigs).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Courier Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Courier</label>
          <select 
            value={courier} 
            onChange={e => setCourier(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
          >
            {currentConfig.couriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Methods Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '12px', color: '#ccc', fontSize: '14px' }}>Methods</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {availableMethods.length > 0 ? (
              availableMethods.map((m) => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{ color: '#ccc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="method" 
                      value={m.name} 
                      checked={method === m.name} 
                      onChange={e => setMethod(e.target.value)} 
                      required 
                    /> 
                    <span>{m.name}</span>
                    <strong style={{ color: '#4caf50', marginLeft: '4px' }}>{m.price}$</strong>
                  </label>

                  {m.badge && (
                    <span 
                      onClick={() => setActiveDesc(m)}
                      style={{ 
                        backgroundColor: m.badgeColor || '#4caf50', 
                        color: '#fff', 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      {m.badge}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#888', fontSize: '14px' }}>No methods available for the selected courier.</div>
            )}
          </div>
        </div>

        {/* Tracking Number */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Tracking number (One per line for bulk orders)</label>
          <textarea value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} required placeholder="Your package tracking numbers" rows="3" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}></textarea>
        </div>

        {/* Note */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes for this order" rows="4" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
        </div>

        {/* File Upload */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>
            Upload Reference Document / Image (Stored in Database)
          </label>
          <div 
            onClick={() => document.getElementById('ftid_file_input').click()}
            className="custom_file_dropzone"
          >
            <input 
              id="ftid_file_input" 
              type="file" 
              multiple
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            {fileData && fileData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                {fileData.map((file, idx) => (
                  <div key={idx} className="file_selected_box" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,242,254,0.05)', border: '1px solid rgba(0,242,254,0.2)', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className='bx bx-file-find' style={{ fontSize: '24px', color: '#00f2fe' }}></i>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ color: '#00f2fe', fontWeight: '600', fontSize: '13px', wordBreak: 'break-all' }}>{file.filename}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setFileData(prev => {
                          const newArr = prev.filter((_, i) => i !== idx);
                          return newArr.length ? newArr : null;
                        }); 
                      }}
                      className="btn_remove_file"
                      title="Remove file"
                      style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '18px' }}
                    >
                      <i className='bx bx-trash'></i>
                    </button>
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <span style={{ color: '#00f2fe', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}>+ Click to add more files</span>
                </div>
              </div>
            ) : (
              <div className="dropzone_placeholder">
                <i className='bx bx-cloud-upload' style={{ fontSize: '36px', color: '#00f2fe', marginBottom: '6px' }}></i>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  <span style={{ color: '#00f2fe', textDecoration: 'underline' }}>Click to upload</span> or drag & drop file
                </div>
                <div style={{ color: '#777', fontSize: '12px', marginTop: '4px' }}>PDF, PNG, JPG, JPEG or WEBP (Max 10MB)</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Payment Method</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Crypto" 
                checked={paymentMethod === 'Crypto'} 
                onChange={e => setPaymentMethod(e.target.value)} 
              />
              Crypto Payment (Manual)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Wallet Balance" 
                checked={paymentMethod === 'Wallet Balance'} 
                onChange={e => setPaymentMethod(e.target.value)} 
                disabled={!user || user.credits < currentTotalPrice}
              />
              Wallet Balance (${user ? user.credits : 0} available)
            </label>
          </div>
          {paymentMethod === 'Wallet Balance' && user && user.credits < currentTotalPrice && (
            <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '5px' }}>Insufficient balance. Please deposit funds first.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button type="submit" disabled={submitting || (paymentMethod === 'Wallet Balance' && user.credits < currentTotalPrice)} style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', opacity: (submitting || (paymentMethod === 'Wallet Balance' && user.credits < currentTotalPrice)) ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : `Create Order & Pay ($${currentTotalPrice})`}
          </button>
        </div>
      </form>
      
      {orderSuccessMsg && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', borderRadius: '8px', color: '#4caf50', textAlign: 'center', fontWeight: 'bold' }}>
          ✅ {orderSuccessMsg}
        </div>
      )}

      {/* Description Popup Modal */}
      {activeDesc && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(5, 7, 10, 0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: '16px', overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: '#12151a',
            background: 'linear-gradient(145deg, #161a22 0%, #0e1014 100%)',
            padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '100%',
            border: '1px solid rgba(0, 242, 254, 0.3)', color: '#fff',
            maxHeight: '90vh', overflowY: 'auto', margin: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative'
          }}>
            <h3 style={{ marginTop: 0, color: '#00f2fe', fontSize: '18px', fontWeight: '700' }}>{activeDesc.name}</h3>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6', margin: '15px 0' }}>
              {activeDesc.desc && activeDesc.desc.trim() !== '' ? activeDesc.desc : activeDesc.badge}
            </p>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setActiveDesc(null)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)', padding: '10px 24px',
                  borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full screen order processing loader overlay */}
      {loadingTransition && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(5, 7, 10, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, color: '#ffffff'
        }}>
          <style>{`
            @keyframes spinOrder {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: '3px solid rgba(0, 242, 254, 0.15)',
            borderTopColor: '#00f2fe',
            animation: 'spinOrder 0.9s linear infinite',
            marginBottom: '20px',
            boxShadow: '0 0 30px rgba(0,242,254,0.3)'
          }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff', letterSpacing: '-0.3px' }}>
            Processing Your Order...
          </h3>
          <p style={{ color: '#00f2fe', fontSize: '13px', margin: 0, fontWeight: '600', letterSpacing: '0.3px' }}>
            Generating Secure Crypto Payment Gateway...
          </p>
        </div>
      )}

      {pendingOrderData && (
        <PrePaymentModal
          orderData={pendingOrderData}
          apiBase={API_BASE_URL}
          onClose={() => setPendingOrderData(null)}
          onPaymentConfirmed={(savedOrder) => {
            setPendingOrderData(null);
            setOrderSuccessMsg('Payment confirmed! Your order has been placed successfully.');
            setTimeout(() => setOrderSuccessMsg(''), 4000);
            setTrackingNumber(''); setNote(''); setFileData(null);
          }}
        />
      )}
    </div>
  );
}

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
    if (checkStatus === 'confirmed') return;
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
      }
    } catch (e) {
      console.error(e);
      setCheckStatus('idle');
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
