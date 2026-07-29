import React, { useState, useEffect } from 'react';
import PaymentModal from '../components/PaymentModal';
import API_BASE_URL from '../config';

export default function FtidSubmitOrder() {
  const [country, setCountry] = useState('United States US');
  const [courier, setCourier] = useState('UPS');
  const [method, setMethod] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [fileData, setFileData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [activeDesc, setActiveDesc] = useState(null);

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
    if (dbProducts.length === 0) return defaultCountryConfigs;
    const configs = {};
    dbProducts.forEach(item => {
      if (!configs[item.category]) {
        configs[item.category] = { couriers: [], methods: [] };
      }
      if (!configs[item.category].couriers.includes(item.courier)) {
        configs[item.category].couriers.push(item.courier);
      }
      configs[item.category].methods.push({
        name: item.name,
        price: item.price,
        desc: item.desc,
        badge: item.badge,
        badgeColor: item.badgeColor,
        courier: item.courier
      });
    });
    return configs;
  }, [dbProducts]);

  const currentConfig = countryConfigs[country] || Object.values(countryConfigs)[0] || { couriers: [], methods: [] };
  const availableMethods = currentConfig.methods ? currentConfig.methods.filter(m => !m.courier || m.courier === courier || currentConfig.methods.length === 1) : [];

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
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      alert("Please log in to submit an order.");
      return;
    }

    const selectedMethodObj = currentConfig.methods.find(m => m.name === method);
    const price = selectedMethodObj ? selectedMethodObj.price : 30;

    setSubmitting(true);

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
          status: 'Pending Payment',
          paymentStatus: 'Pending Payment'
        })
      });
      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setCreatedOrder(data);
        setTrackingNumber(''); setNote(''); setFileData(null);
      } else {
        alert(data.error || "Failed to create order.");
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
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
            {(availableMethods.length > 0 ? availableMethods : currentConfig.methods).map((m) => (
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
            ))}
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
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>Upload File (PDF / Images - stored in Database)</label>
          <input type="file" onChange={handleFileChange} style={{ color: '#ccc', fontSize: '14px' }} />
          {fileData && (
            <div style={{ color: '#4caf50', fontSize: '12px', marginTop: '5px' }}>
              Selected: {fileData.filename}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : 'Create Order & Pay'}
          </button>
        </div>
      </form>

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

      {createdOrder && (
        <PaymentModal order={createdOrder} onClose={() => setCreatedOrder(null)} />
      )}
    </div>
  );
}

