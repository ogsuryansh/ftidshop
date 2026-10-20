import React, { useState } from 'react';
import PaymentModal from '../components/PaymentModal';
import PrePaymentModal from '../components/PrePaymentModal';
import API_BASE_URL from '../config';

import { useSyncUser, setStoredUser, fetchLatestUserData } from '../utils/userSync';

export default function ReceiptsSubmitOrder() {
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [fileData, setFileData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTransition, setLoadingTransition] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Crypto');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [pendingOrderData, setPendingOrderData] = useState(null);

  const [user, setUser] = useSyncUser();

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
    if (submitting) return; // Prevent double-clicks on the frontend
    if (!category || category === 'Select category') {
      alert("Please select a category.");
      return;
    }
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

    const basePrice = categoryPrices[category] || 15;
    const fileCount = fileData ? fileData.length : 0;
    const quantity = Math.max(fileCount, 1);
    const price = basePrice * quantity;

    if (paymentMethod === 'Wallet Balance') {
      setSubmitting(true);
      setLoadingTransition(true);

      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id || user.id,
            type: 'Receipt',
            country: category,
            method: category,
            note,
            fileData,
            price,
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
            setCategory(''); setNote(''); setFileData(null);
          } else {
            alert(data.error || "Failed to create order.");
          }
        }, 1200);
      } catch (err) {
        console.error(err);
        setSubmitting(false);
        setLoadingTransition(false);
        alert("Error submitting order.");
      }
      return;
    }

    // For Crypto: store order data in state with small random cents (e.g. $15.07) for 100% unique auto-matching
    const randomCents = (Math.floor(Math.random() * 47) + 3) / 100;
    const uniquePrice = Number((price + randomCents).toFixed(2));

    setPendingOrderData({
      userId: user._id || user.id,
      type: 'Receipt',
      country: category,
      method: category,
      note,
      fileData,
      price: uniquePrice,
      paymentMethod: 'Crypto'
    });
  };

  const renderCategoryPrices = {
    'United States Receipt': 15,
    'Canada Receipt': 15,
    'Italy Receipts': 20,
    'Germany Receipts': 20
  };
  const currentBasePrice = renderCategoryPrices[category] || 15;
  const currentFileCount = fileData ? fileData.length : 0;
  const currentQuantity = Math.max(currentFileCount, 1);
  const currentTotalPrice = category ? currentBasePrice * currentQuantity : 0;

  return (
    <div style={{ padding: '20px 0', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>New receipt order</h2>
      
      <div style={{ backgroundColor: '#31708f', color: '#d9edf7', padding: '15px 20px', borderRadius: '6px', marginBottom: '30px', fontSize: '14px', lineHeight: '1.5' }}>
        If any information is missing, we will complete it using the most appropriate details available from the tracking information. Please ensure all data is provided in English only.
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#14171e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', fontSize: '15px' }}>
            <option value="">Select category</option>
            <option value="United States Receipt">United States Receipt ($15)</option>
            <option value="Canada Receipt">Canada Receipt ($15)</option>
            <option value="Italy Receipts">Italy Receipts ($20)</option>
            <option value="Germany Receipts">Germany Receipts ($20)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Order Details / Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Provide store name, items, date, or specific receipt notes" rows="3" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#14171e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>
            Upload Reference Document / Image (Stored in Database)
          </label>
          <div 
            onClick={() => document.getElementById('receipt_file_input').click()}
            className="custom_file_dropzone"
          >
            <input 
              id="receipt_file_input" 
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
                if (user && user.credits >= currentTotalPrice && category) {
                  setPaymentMethod('Wallet Balance');
                }
              }}
              className={`payment_choice_card ${paymentMethod === 'Wallet Balance' ? 'active' : ''} ${(!user || user.credits < currentTotalPrice || !category) ? 'disabled' : ''}`}
            >
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Wallet Balance" 
                checked={paymentMethod === 'Wallet Balance'} 
                onChange={() => {
                  if (user && user.credits >= currentTotalPrice && category) {
                    setPaymentMethod('Wallet Balance');
                  }
                }} 
                disabled={!user || user.credits < currentTotalPrice || !category}
              />
              <div>
                <div className="choice_title">Wallet Balance</div>
                <div className="choice_sub">${user ? user.credits : 0} available</div>
              </div>
            </div>
          </div>
          {paymentMethod === 'Wallet Balance' && user && user.credits < currentTotalPrice && category && (
            <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '8px' }}>Insufficient balance. Please deposit funds first.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button 
            type="submit" 
            disabled={submitting || !category || (paymentMethod === 'Wallet Balance' && user.credits < currentTotalPrice)} 
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
              opacity: (submitting || !category || (paymentMethod === 'Wallet Balance' && user.credits < currentTotalPrice)) ? 0.7 : 1 
            }}
          >
            {submitting ? 'Submitting...' : (category ? `Create Order & Pay ($${currentTotalPrice})` : 'Create Order & Pay')}
          </button>
        </div>
      </form>
      
      {orderSuccessMsg && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', borderRadius: '8px', color: '#4caf50', textAlign: 'center', fontWeight: 'bold' }}>
          ✅ {orderSuccessMsg}
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

      {pendingOrderData && (
        <PrePaymentModal
          orderData={pendingOrderData}
          apiBase={API_BASE_URL}
          onClose={() => setPendingOrderData(null)}
          onPaymentConfirmed={(savedOrder) => {
            setPendingOrderData(null);
            setOrderSuccessMsg('Payment confirmed! Your order has been placed successfully.');
            setTimeout(() => setOrderSuccessMsg(''), 4000);
            setCategory(''); setNote(''); setFileData(null);
          }}
        />
      )}
    </div>
  );
}
