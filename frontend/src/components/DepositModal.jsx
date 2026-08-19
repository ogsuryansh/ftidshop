import React, { useState, useEffect } from 'react';
import PaymentModal from './PaymentModal';
import API_BASE_URL from '../config';

export default function DepositModal({ onClose }) {
  const userStr = localStorage.getItem('user');
  const user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');
  
  const [settings, setSettings] = useState({ minDeposit: 20, depositBonusThreshold: 100, depositBonusPercentage: 20 });
  const [depositAmount, setDepositAmount] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && data.minDeposit) {
          setSettings(data);
          setDepositAmount(data.minDeposit.toString());
        }
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in.");
    
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount < settings.minDeposit) {
      return alert(`Minimum deposit is $${settings.minDeposit}`);
    }
    
    setDepositLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'deposit',
          name: 'Wallet Deposit',
          price: amount,
          status: 'Pending Payment',
          paymentStatus: 'Pending Payment'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedOrder(data);
      } else {
        alert(data.error || 'Failed to initialize deposit');
      }
    } catch (err) {
      alert('Network error initializing deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // refresh user data to get updated credits
    fetch(`${API_BASE_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          const updated = { ...user, credits: data.credits };
          localStorage.setItem('user', JSON.stringify(updated));
          window.dispatchEvent(new Event('user-updated'));
        }
        setCreatedOrder(null);
        onClose();
      });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 10, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      {!createdOrder ? (
        <div style={{ backgroundColor: '#1c1e1f', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '450px', border: '1px solid rgba(0, 242, 254, 0.3)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
          <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '20px', fontWeight: '600' }}>
            <i className='bx bx-plus-circle' style={{ color: '#00f2fe', marginRight: '8px' }}></i> Add Funds to Wallet
          </h3>
          
          <form onSubmit={handleDeposit}>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #7f00ff', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '8px' }}>
                <strong>Minimum Deposit:</strong> ${settings.minDeposit}
              </div>
              {settings.depositBonusPercentage > 0 && (
                <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>
                  🎁 Bonus Offer: Deposit ${settings.depositBonusThreshold} or more and get a {settings.depositBonusPercentage}% bonus instantly!
                </div>
              )}
            </div>

            <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '8px' }}>Deposit Amount (USD)</label>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontWeight: 'bold' }}>$</span>
              <input 
                type="number" 
                min={settings.minDeposit} 
                step="any" 
                required 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 35px', backgroundColor: '#12151b', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={depositLoading}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00f2fe, #7f00ff)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: depositLoading ? 'not-allowed' : 'pointer', opacity: depositLoading ? 0.7 : 1 }}
            >
              {depositLoading ? 'Initializing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      ) : (
        <PaymentModal 
          order={createdOrder} 
          onClose={() => setCreatedOrder(null)} 
          onPaymentConfirmed={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
