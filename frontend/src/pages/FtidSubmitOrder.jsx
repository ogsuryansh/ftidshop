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

  const user = safeParseUser(localStorage.getItem('user'));

  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFileData(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileData({
        filename: file.name,
        data: reader.result,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit an order.");
      return;
    }

    const selectedMethodObj = currentConfig.methods.find(m => m.name === method);
    const price = selectedMethodObj ? selectedMethodObj.price : 30;

    setSubmitting(true);
    setLoadingTransition(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'FTID',
          country,
          courier,
          method,
          trackingNumber,
          note,
          fileData,
          price,
          status: paymentMethod === 'Wallet Balance' ? 'Pending' : 'Pending Payment',
          paymentStatus: paymentMethod === 'Wallet Balance' ? 'Paid' : 'Pending Payment',
          paymentMethod
        })
      });
      const data = await res.json();

      if (res.ok) {
        setTimeout(() => {
          setSubmitting(false);
          setLoadingTransition(false);
          
          if (paymentMethod === 'Wallet Balance') {
             // Deduct locally for immediate UI update
             const updatedUser = { ...user, credits: user.credits - price };
             localStorage.setItem('user', JSON.stringify(updatedUser));
             setOrderSuccessMsg('Order paid successfully using Wallet Balance!');
             setTimeout(() => setOrderSuccessMsg(''), 3000);
          } else {
             setCreatedOrder(data);
          }
          
          setTrackingNumber(''); setNote(''); setFileData(null);
        }, 1200);
      } else {
        setSubmitting(false);
        setLoadingTransition(false);
        alert(data.error || "Failed to create order.");
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setLoadingTransition(false);
      alert("Error submitting order.");
    }
  };

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
                      onClick={() => m.badge === 'Click to read description' && setActiveDesc(m)}
                      style={{ 
                        backgroundColor: m.badgeColor || '#4caf50', 
                        color: '#fff', 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        cursor: m.badge === 'Click to read description' ? 'pointer' : 'default',
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
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Tracking number</label>
          <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} required placeholder="Your package tracking number" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
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
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            {fileData ? (
              <div className="file_selected_box">
                <i className='bx bx-file-find' style={{ fontSize: '28px', color: '#00f2fe' }}></i>
                <div>
                  <div style={{ color: '#00f2fe', fontWeight: '600', fontSize: '14px' }}>{fileData.filename}</div>
                  <div style={{ color: '#888', fontSize: '12px' }}>File attached successfully</div>
                </div>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setFileData(null); }}
                  className="btn_remove_file"
                  title="Remove file"
                >
                  <i className='bx bx-x'></i>
                </button>
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
                disabled={!user || user.credits < (currentConfig.methods.find(m => m.name === method)?.price || 0)}
              />
              Wallet Balance (${user ? user.credits : 0} available)
            </label>
          </div>
          {paymentMethod === 'Wallet Balance' && user && user.credits < (currentConfig.methods.find(m => m.name === method)?.price || 0) && (
            <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '5px' }}>Insufficient balance. Please deposit funds first.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button type="submit" disabled={submitting || (paymentMethod === 'Wallet Balance' && user.credits < (currentConfig.methods.find(m => m.name === method)?.price || 0))} style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', opacity: (submitting || (paymentMethod === 'Wallet Balance' && user.credits < (currentConfig.methods.find(m => m.name === method)?.price || 0))) ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : 'Create Order & Pay'}
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
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6', margin: '15px 0' }}>{activeDesc.desc}</p>
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

      {createdOrder && (
        <PaymentModal order={createdOrder} onClose={() => setCreatedOrder(null)} />
      )}
    </div>
  );
}

