import React, { useState } from 'react';
import PaymentModal from '../components/PaymentModal';

export default function FtidSubmitOrder() {
  const [country, setCountry] = useState('');
  const [courier, setCourier] = useState('');
  const [method, setMethod] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [fileData, setFileData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

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

    const methodPrices = {
      'FTIDV3': 10,
      'Drop only': 5,
      'LIT (Ground Express Only)': 20,
      'FTIDNA [Only tracking number needed]': 30,
      'LIT': 25
    };
    
    const price = methodPrices[method] || 0;
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
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
        setCountry(''); setCourier(''); setMethod(''); setTrackingNumber(''); setNote(''); setFileData(null);
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
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Country</label>
          <input type="text" value={country} onChange={e => setCountry(e.target.value)} required placeholder="United States 🇺🇸" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Courier</label>
          <input type="text" value={courier} onChange={e => setCourier(e.target.value)} required placeholder="FedEx / UPS / USPS" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Methods</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <label style={{ color: '#ccc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
              <input type="radio" name="method" value="FTIDV3" checked={method === 'FTIDV3'} onChange={e => setMethod(e.target.value)} required /> 
              FTIDV3 <strong style={{ color: '#4caf50' }}>10$</strong> <span style={{ color: '#4caf50', marginLeft: '5px' }}>Label is required</span>
            </label>
            
            <label style={{ color: '#ccc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
              <input type="radio" name="method" value="Drop only" checked={method === 'Drop only'} onChange={e => setMethod(e.target.value)} /> 
              Drop only <strong style={{ color: '#4caf50' }}>5$</strong> <span style={{ color: '#4caf50', marginLeft: '5px' }}>Label is required</span>
            </label>
            
            <label style={{ color: '#ccc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
              <input type="radio" name="method" value="LIT (Ground Express Only)" checked={method === 'LIT (Ground Express Only)'} onChange={e => setMethod(e.target.value)} /> 
              LIT (Ground Express Only) <strong style={{ color: '#4caf50' }}>20$</strong> <span style={{ color: '#4caf50', marginLeft: '5px' }}>Label is required</span>
            </label>
            
            <label style={{ color: '#ccc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
              <input type="radio" name="method" value="FTIDNA [Only tracking number needed]" checked={method === 'FTIDNA [Only tracking number needed]'} onChange={e => setMethod(e.target.value)} /> 
              FTIDNA [Only tracking number needed] <strong style={{ color: '#4caf50' }}>30$</strong> 
            </label>
            
            <label style={{ color: '#ccc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
              <input type="radio" name="method" value="LIT" checked={method === 'LIT'} onChange={e => setMethod(e.target.value)} /> 
              LIT <strong style={{ color: '#4caf50' }}>25$</strong> <span style={{ color: '#4caf50', marginLeft: '5px' }}>Label is required</span>
            </label>

          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Tracking number</label>
          <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} required placeholder="Your package tracking number" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes for this order" rows="4" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
        </div>

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
          <button type="submit" disabled={submitting} style={{ backgroundColor: '#ff8c00', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : 'Create Order & Pay'}
          </button>
        </div>
      </form>

      {createdOrder && (
        <PaymentModal order={createdOrder} onClose={() => setCreatedOrder(null)} />
      )}
    </div>
  );
}
