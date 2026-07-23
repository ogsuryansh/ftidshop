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

  // Configuration for Couriers & Methods per Country
  const countryConfigs = {
    'Insider Scans "Only tracking needed"': {
      couriers: ['UPS', 'FedEx', 'USPS'],
      methods: [
        { name: 'Cali LIT (Very Limited)', price: 45, desc: 'Specialized Lost In Transit method for California region shipments with high success rate.', badge: 'Click to read description', badgeColor: '#d9534f' },
        { name: 'UPS UTD (must be in transit = yes)', price: 60, desc: 'Unable To Deliver scan update for active UPS packages currently in transit.', badge: null },
        { name: 'UPS RTS', price: 60, desc: 'Return To Sender scan process for UPS packages.', badge: null },
        { name: 'UPS LIT Store', price: 45, desc: 'Lost In Transit method performed via physical UPS Store dropoffs.', badge: 'Click to read description', badgeColor: '#d9534f' },
        { name: 'AP LIT WORLDWIDE', price: 30, desc: 'Worldwide Access Point LIT service for international UPS tracking.', badge: 'Click to read description', badgeColor: '#d9534f' }
      ]
    },
    'United States US': {
      couriers: ['UPS', 'FedEx', 'USPS'],
      methods: [
        { name: 'Cali LIT (Very Limited)', price: 45, desc: 'Specialized Lost In Transit method for California region shipments with high success rate.', badge: 'Click to read description', badgeColor: '#d9534f' },
        { name: 'UPS UTD (must be in transit = yes)', price: 60, desc: 'Unable To Deliver scan update for active UPS packages currently in transit.', badge: null },
        { name: 'UPS RTS', price: 60, desc: 'Return To Sender scan process for UPS packages.', badge: null },
        { name: 'UPS LIT Store', price: 45, desc: 'Lost In Transit method performed via physical UPS Store dropoffs.', badge: 'Click to read description', badgeColor: '#d9534f' },
        { name: 'AP LIT WORLDWIDE', price: 30, desc: 'Worldwide Access Point LIT service for international UPS tracking.', badge: 'Click to read description', badgeColor: '#d9534f' }
      ]
    },
    'Canada CA': {
      couriers: ['Canada Post', 'Purolator', 'UPS', 'FedEx', 'DHL'],
      methods: [
        { name: 'FTIDV3', price: 20, desc: 'FTID Version 3 processing. High speed delivery status update.', badge: 'Label is required', badgeColor: '#4caf50' },
        { name: 'LIT', price: 35, desc: 'Lost in Transit scan update for Canadian courier shipments.', badge: 'Label is required', badgeColor: '#4caf50' },
        { name: 'FTIDNA', price: 35, desc: 'FTID No Access / No Arrival update for Canadian carriers.', badge: 'Label is required', badgeColor: '#4caf50' }
      ]
    },
    'Germany DE': {
      couriers: ['DHL', 'DPD', 'GLS', 'UPS', 'Hermes', 'DHL Express'],
      methods: [
        { name: 'FTIDV3', price: 25, desc: 'FTID Version 3 processing for EU / Germany shipments.', badge: 'Label is required', badgeColor: '#4caf50' },
        { name: 'LIT', price: 40, desc: 'Lost in Transit scan update for German couriers.', badge: 'Label is required', badgeColor: '#4caf50' },
        { name: 'FTIDNA', price: 40, desc: 'FTID No Arrival update for European carriers.', badge: 'Label is required', badgeColor: '#4caf50' }
      ]
    }
  };

  const currentConfig = countryConfigs[country] || countryConfigs['United States US'];

  // Automatically select first courier and method when country changes
  useEffect(() => {
    if (currentConfig) {
      setCourier(currentConfig.couriers[0]);
      if (currentConfig.methods.length > 0) {
        setMethod(currentConfig.methods[0].name);
      }
    }
  }, [country]);

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
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Country</label>
          <select 
            value={country} 
            onChange={e => setCountry(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
          >
            <option value='Insider Scans "Only tracking needed"'>Insider Scans "Only tracking needed"</option>
            <option value="United States US">United States US</option>
            <option value="Canada CA">Canada CA</option>
            <option value="Germany DE">Germany DE</option>
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
            {currentConfig.methods.map((m) => (
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#222', padding: '25px', borderRadius: '10px', maxWidth: '450px', width: '90%', border: '1px solid #444', color: '#fff' }}>
            <h3 style={{ marginTop: 0, color: '#00f2fe', fontSize: '18px' }}>{activeDesc.name}</h3>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', margin: '15px 0' }}>{activeDesc.desc}</p>
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setActiveDesc(null)} style={{ backgroundColor: '#444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
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

