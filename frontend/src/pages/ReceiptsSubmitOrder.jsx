import React, { useState } from 'react';
import PaymentModal from '../components/PaymentModal';
import API_BASE_URL from '../config';

export default function ReceiptsSubmitOrder() {
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [fileData, setFileData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTransition, setLoadingTransition] = useState(false);
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
    if (!category || category === 'Select category') {
      alert("Please select a category.");
      return;
    }
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      alert("Please log in to submit an order.");
      return;
    }

    const categoryPrices = {
      'United States Receipt': 15,
      'Canada Receipt': 15,
      'Italy Receipts': 20,
      'Germany Receipts': 20
    };

    const price = categoryPrices[category] || 15;
    setSubmitting(true);
    setLoadingTransition(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'Receipt',
          country: category,
          method: category,
          note,
          fileData,
          price,
          status: 'Pending Payment',
          paymentStatus: 'Pending Payment'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setTimeout(() => {
          setSubmitting(false);
          setLoadingTransition(false);
          setCreatedOrder(data);
          setCategory(''); setNote(''); setFileData(null);
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
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>New receipt order</h2>
      
      <div style={{ backgroundColor: '#31708f', color: '#d9edf7', padding: '15px 20px', borderRadius: '6px', marginBottom: '30px', fontSize: '14px', lineHeight: '1.5' }}>
        If any information is missing, we will complete it using the most appropriate details available from the tracking information. Please ensure all data is provided in English only.
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }}>
            <option value="">Select category</option>
            <option value="United States Receipt">United States Receipt ($15)</option>
            <option value="Canada Receipt">Canada Receipt ($15)</option>
            <option value="Italy Receipts">Italy Receipts ($20)</option>
            <option value="Germany Receipts">Germany Receipts ($20)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Order Details / Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Provide store name, items, date, or specific receipt notes" rows="4" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>Upload Reference Document / Image (Stored in Database)</label>
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
            @keyframes spinOrderReceipt {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: '3px solid rgba(0, 242, 254, 0.15)',
            borderTopColor: '#00f2fe',
            animation: 'spinOrderReceipt 0.9s linear infinite',
            marginBottom: '20px',
            boxShadow: '0 0 30px rgba(0,242,254,0.3)'
          }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff', letterSpacing: '-0.3px' }}>
            Processing Your Receipt Order...
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
