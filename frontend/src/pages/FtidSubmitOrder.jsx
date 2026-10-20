import React, { useState, useEffect } from 'react';
import PaymentModal from '../components/PaymentModal';
import PrePaymentModal from '../components/PrePaymentModal';
import API_BASE_URL from '../config';

import { useSyncUser, setStoredUser, fetchLatestUserData } from '../utils/userSync';

export default function FtidSubmitOrder() {
  const [country, setCountry] = useState('United States US');
  const [courier, setCourier] = useState('UPS');
  const [method, setMethod] = useState('FTID');
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

  const [user, setUser] = useSyncUser();

  const [dbProducts, setDbProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_ftid_products');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data);
          try {
            localStorage.setItem('cached_ftid_products', JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(err => console.error("Error loading products:", err));
  }, []);

  // Default initial configuration for Couriers & Methods per Country matching database products
  const defaultCountryConfigs = {
    'United States US': {
      couriers: ['UPS', 'FedEx', 'USPS'],
      methods: [
        { name: 'FTID', price: 8, desc: '', badge: 'Return Label Required', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'FTIDNA', price: 20, desc: 'Only tracking required works on incoming packages', badge: 'Click here to check description', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'ONLY EDIT', price: 6, desc: '', badge: 'Label required', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'RECEIPT+FTID', price: 20, desc: '', badge: 'ORIGINAL RECEIPT', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'RTS + FTIDNA', price: 45, desc: 'Package gonna show returned to different location.', badge: 'Package gonna show returned to different location', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'RTS + UTD', price: 45, desc: 'RTS + UTD will delete POD and lock track', badge: 'RTS + UTD will delete POD and lock track', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'UNTRACEABLE LABEL', price: 10, desc: '', badge: 'Label have both UPS and USPS label/TRACKING', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'UPS AP LIT', price: 30, desc: '', badge: 'Any state for your choice it is done on return label', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'UTD UPS', price: 60, desc: 'Can be done incoming and outgoing. PROOF OF DELIVERY (POD) never show for incoming tracks', badge: 'Can be done incoming and outgoing. PROOF OF DELIVERY (POD) never show for incoming tracks', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'FTID', price: 8, desc: '', badge: 'RETURN LABEL REQUIRED', badgeColor: '#d9534f', courier: 'FedEx' },
        { name: 'RECEIPT+FTID', price: 20, desc: 'Printed receipt', badge: 'ORIGINAL RECEIPT', badgeColor: '#d9534f', courier: 'FedEx' },
        { name: 'ONLY EDIT', price: 6, desc: '', badge: 'RETURN LABEL REQUIRED', badgeColor: '#d9534f', courier: 'FedEx' },
        { name: 'FTIDNA', price: 25, desc: 'Only tracking required works on incoming packages', badge: 'Click here to check description', badgeColor: '#d9534f', courier: 'USPS' },
        { name: 'RECEIPT+FTID', price: 20, desc: '', badge: 'ORIGINAL RECEIPT', badgeColor: '#d9534f', courier: 'USPS' },
        { name: 'ONLY EDIT', price: 6, desc: '', badge: 'RETURN LABEL REQUIRED', badgeColor: '#d9534f', courier: 'USPS' },
        { name: 'UNTRACEABLE TRACKING', price: 10, desc: '', badge: 'PARCEL RETURN SVC', badgeColor: '#d9534f', courier: 'USPS' }
      ]
    },
    'Canada CA': {
      couriers: ['UPS', 'FedEx'],
      methods: [
        { name: 'UPS AP LIT', price: 30, desc: '', badge: 'Return label required', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'ONLY EDIT', price: 6, desc: '', badge: 'RETURN LABEL REQUIRED', badgeColor: '#d9534f', courier: 'UPS' },
        { name: 'FEDEX FTID', price: 20, desc: 'NEED RETURN LABEL', badge: 'NEED RETURN LABEL', badgeColor: '#d9534f', courier: 'FedEx' },
        { name: 'ONLY EDIT', price: 6, desc: '', badge: 'RETURN LABEL REQUIRED', badgeColor: '#d9534f', courier: 'FedEx' }
      ]
    },
    'Insider Scans "Only tracking needed"': {
      couriers: ['USPS'],
      methods: [
        { name: 'USPS rts', price: 50, desc: '', badge: 'Return to sender after delivery', badgeColor: '#d9534f', courier: 'USPS' },
        { name: 'LIT', price: 20, desc: 'Tracking will show dropped off after that no movement', badge: 'Click to check description', badgeColor: '#d9534f', courier: 'USPS' }
      ]
    },
    'SPAIN': {
      couriers: ['UPS'],
      methods: [
        { name: 'FTID', price: 25, desc: 'RETURN LABEL REQUIRED', badge: 'RETURN LABEL REQUIRED', badgeColor: '#d9534f', courier: 'UPS' }
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
            const newCredits = typeof data.remainingCredits === 'number'
              ? data.remainingCredits
              : (user ? user.credits - price : 0);
            const updatedUser = { ...user, credits: newCredits };
            setStoredUser(updatedUser);
            fetchLatestUserData();
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

    // For Crypto: store order data in state with small random cents (e.g. $30.07) for 100% unique auto-matching
    const randomCents = (Math.floor(Math.random() * 47) + 3) / 100;
    const uniquePrice = Number((price + randomCents).toFixed(2));

    setPendingOrderData({
      userId: user._id || user.id,
      type: 'FTID', country, courier, method, trackingNumber, note, fileData,
      price: uniquePrice,
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
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Country / Category</label>
          <select 
            value={country} 
            onChange={e => setCountry(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#14171e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', fontSize: '15px' }}
          >
            {Object.keys(countryConfigs).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Courier Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Courier</label>
          <select 
            value={courier} 
            onChange={e => setCourier(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#14171e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', fontSize: '15px' }}
          >
            {currentConfig.couriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Methods Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '10px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Select Method</label>
          <div className="order_methods_list">
            {availableMethods.length > 0 ? (
              availableMethods.map((m) => (
                <div 
                  key={m.name} 
                  onClick={() => setMethod(m.name)}
                  className={`order_method_card ${method === m.name ? 'selected' : ''}`}
                >
                  <div className="method_card_main">
                    <div className="method_card_left">
                      <input 
                        type="radio" 
                        name="method" 
                        value={m.name} 
                        checked={method === m.name} 
                        onChange={() => setMethod(m.name)} 
                        className="method_radio"
                        required 
                      /> 
                      <span className="method_name">{m.name}</span>
                    </div>
                    <span className="method_price_tag">${m.price}</span>
                  </div>

                  {m.badge && (
                    <div className="method_badge_row">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDesc(m);
                        }}
                        className="method_badge_pill"
                        style={{ 
                          backgroundColor: m.badgeColor ? `${m.badgeColor}22` : 'rgba(239, 68, 68, 0.18)', 
                          color: m.badgeColor || '#ff6b6b',
                          borderColor: m.badgeColor ? `${m.badgeColor}55` : 'rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <i className='bx bx-info-circle'></i> {m.badge}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#888', fontSize: '14px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
                No methods available for the selected courier.
              </div>
            )}
          </div>
        </div>

        {/* Tracking Number */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>
            Tracking number <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional - one per line for bulk orders)</span>
          </label>
          <textarea 
            value={trackingNumber} 
            onChange={e => setTrackingNumber(e.target.value)} 
            placeholder="Your package tracking numbers (optional)" 
            rows="3" 
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#14171e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
          ></textarea>
        </div>

        {/* Note */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes for this order" rows="3" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#14171e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
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
          <label style={{ display: 'block', marginBottom: '10px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Payment Method</label>
          <div className="payment_method_grid">
            <div 
              onClick={() => setPaymentMethod('Crypto')}
              className={`payment_choice_card ${paymentMethod === 'Crypto' ? 'active' : ''}`}
            >
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Crypto" 
                checked={paymentMethod === 'Crypto'} 
                onChange={() => setPaymentMethod('Crypto')} 
              />
              <div>
                <div className="choice_title">Crypto Payment</div>
                <div className="choice_sub">BTC, LTC, Stars, USDT, SOL, ETH, TON</div>
              </div>
            </div>

            <div 
              onClick={() => {
                if (user && user.credits >= currentTotalPrice) {
                  setPaymentMethod('Wallet Balance');
                }
              }}
              className={`payment_choice_card ${paymentMethod === 'Wallet Balance' ? 'active' : ''} ${(!user || user.credits < currentTotalPrice) ? 'disabled' : ''}`}
            >
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Wallet Balance" 
                checked={paymentMethod === 'Wallet Balance'} 
                onChange={() => {
                  if (user && user.credits >= currentTotalPrice) {
                    setPaymentMethod('Wallet Balance');
                  }
                }} 
                disabled={!user || user.credits < currentTotalPrice}
              />
              <div>
                <div className="choice_title">Wallet Balance</div>
                <div className="choice_sub">${user ? user.credits : 0} available</div>
              </div>
            </div>
          </div>
          {paymentMethod === 'Wallet Balance' && user && user.credits < currentTotalPrice && (
            <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '8px' }}>Insufficient balance. Please deposit funds first.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button 
            type="submit" 
            disabled={submitting || (paymentMethod === 'Wallet Balance' && user.credits < currentTotalPrice)} 
            style={{ 
              background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', 
              color: '#fff', 
              border: 'none', 
              padding: '14px 32px', 
              borderRadius: '30px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              fontSize: '15px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)',
              opacity: (submitting || (paymentMethod === 'Wallet Balance' && user.credits < currentTotalPrice)) ? 0.7 : 1 
            }}
          >
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

