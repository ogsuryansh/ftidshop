import React, { useState, useEffect } from 'react';
import PaymentModal from '../components/PaymentModal';
import API_BASE_URL from '../config';

export default function Dashboard() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const [user, setUser] = useState(userStr ? JSON.parse(userStr) : null);
  
  const username = user ? user.name : 'Unknown';
  const email = user ? user.email : 'unknown@domain.com';
  const credits = user ? user.credits : 0;
  const joinedDate = user && user.joined ? new Date(user.joined).toLocaleString() : 'N/A';
  const is2FAEnabled = !!(user && user.twoFactorEnabled);

  const [activeTab, setActiveTab] = useState('profile');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  // 2FA Modal States
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Refresh latest user profile from server
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      })
      .catch(err => console.error('Error fetching latest user info:', err));
  }, [token]);

  // Step 1: Start 2FA Setup
  const handleStart2FASetup = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/2fa/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShowSetupModal(true);
      } else {
        setErrorMsg(data.error || 'Failed to generate 2FA key.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify & Activate 2FA
  const handleVerifyAndEnable2FA = async (e) => {
    e.preventDefault();
    if (!otpToken || otpToken.length < 6) {
      setErrorMsg('Please enter a valid 6-digit authentication code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: otpToken })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || '2FA enabled successfully!');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          setShowSetupModal(false);
          setOtpToken('');
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Verification failed.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!otpToken || otpToken.length < 6) {
      setErrorMsg('Please enter a valid 6-digit authentication code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: otpToken })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || '2FA Security disabled.');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          setShowDisableModal(false);
          setOtpToken('');
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Failed to disable 2FA.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard_card_panel">
      {/* Header Banner */}
      <div className="profile_header_card">
        <div className="profile_avatar_lg">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="profile_info_header">
          <div className="profile_user_title">
            <h3>{username}</h3>
            <span className="user_role_badge"><i className='bx bxs-badge-check'></i> Verified Member</span>
          </div>
          <p className="profile_email_sub">{email}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard_tab_bar">
        <button 
          className={`tab_btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className='bx bx-user'></i> Profile Settings
        </button>
        <button 
          className={`tab_btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <i className='bx bx-shield-quarter'></i> Security & 2FA
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'profile' && (
        <div className="tab_panel_content">
          <div className="details_grid">
            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-user-circle'></i> Username</div>
              <div className="detail_value">{username}</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-envelope'></i> Email Address</div>
              <div className="detail_value">{email}</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-calendar-event'></i> Account Created</div>
              <div className="detail_value">{joinedDate}</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-wallet-alt'></i> Available Balance</div>
              <div className="detail_value text_gradient_val">${credits} USD</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-lock-alt'></i> Two-Factor Auth</div>
              <div className="detail_value">
                {is2FAEnabled ? (
                  <span className="status_pill pill_success" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <i className='bx bx-check-circle'></i> Enabled
                  </span>
                ) : (
                  <span className="status_pill pill_danger">
                    <i className='bx bx-x-circle'></i> Disabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="tab_panel_content">
          <div className="security_box">
            <h4>Two-Factor Authentication (2FA)</h4>
            <p>Protect your FTID.SHOP account with an extra layer of security using Google Authenticator or Authy.</p>
            
            <div style={{ marginTop: '20px' }}>
              {is2FAEnabled ? (
                <div>
                  <div className="status_pill pill_success" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px 16px', fontSize: '14px', marginBottom: '16px' }}>
                    <i className='bx bx-shield-check' style={{ fontSize: '18px' }}></i> 2FA Security is Active
                  </div>
                  <div>
                    <button 
                      onClick={() => { setShowDisableModal(true); setOtpToken(''); setErrorMsg(''); }}
                      className="btn_signout" 
                      style={{ width: 'auto', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}
                    >
                      <i className='bx bx-lock-open-alt' style={{ marginRight: '6px' }}></i> Disable 2FA Security
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleStart2FASetup} 
                  disabled={loading}
                  className="btn_action_primary"
                >
                  <i className='bx bx-shield-plus'></i> {loading ? 'Generating 2FA Secret...' : 'Enable 2FA Security'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showSetupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="bg_secondary" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '28px', boxSizing: 'border-box', position: 'relative' }}>
            <button 
              onClick={() => setShowSetupModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}
            >
              &times;
            </button>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fff', textAlign: 'center' }}>
              <i className='bx bx-qr-scan' style={{ color: '#00f2fe', marginRight: '8px' }}></i> Set Up 2FA Security
            </h3>
            
            <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', margin: '0 0 20px 0' }}>
              Scan the QR code below with <b>Google Authenticator</b> or <b>Authy</b> app on your phone.
            </p>

            {/* QR Code */}
            {qrCode && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '12px' }}>
                  <img src={qrCode} alt="2FA QR Code" style={{ width: '170px', height: '170px', display: 'block' }} />
                </div>
              </div>
            )}

            {/* Secret key */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#777', display: 'block', textTransform: 'uppercase' }}>Secret Key (Manual Entry)</span>
              <code style={{ fontSize: '14px', color: '#00f2fe', letterSpacing: '1px', fontWeight: 'bold' }}>{secret}</code>
            </div>

            {errorMsg && (
              <div style={{ color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleVerifyAndEnable2FA}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>Enter 6-Digit Passcode from App</label>
                <input 
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otpToken}
                  onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '12px', background: '#12151b', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '18px', textAlign: 'center', letterSpacing: '6px', outline: 'none' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn_action_primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0' }}
              >
                {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {showDisableModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="bg_secondary" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '28px', boxSizing: 'border-box', position: 'relative' }}>
            <button 
              onClick={() => setShowDisableModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}
            >
              &times;
            </button>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fff', textAlign: 'center' }}>
              <i className='bx bx-shield-x' style={{ color: '#ff4d4d', marginRight: '8px' }}></i> Disable 2FA Security
            </h3>
            
            <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', margin: '0 0 20px 0' }}>
              Please enter your 6-digit code from <b>Google Authenticator</b> or <b>Authy</b> to confirm disabling 2FA.
            </p>

            {errorMsg && (
              <div style={{ color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleDisable2FA}>
              <div style={{ marginBottom: '16px' }}>
                <input 
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otpToken}
                  onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '12px', background: '#12151b', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '18px', textAlign: 'center', letterSpacing: '6px', outline: 'none' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn_signout"
                style={{ width: '100%', justifyContent: 'center', height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}
              >
                {loading ? 'Processing...' : 'Confirm & Disable 2FA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {createdOrder && (
        <PaymentModal 
          order={createdOrder} 
          onClose={() => setCreatedOrder(null)} 
          onPaymentConfirmed={() => {
            // refresh user data to get updated credits
            fetch(`${API_BASE_URL}/api/user/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(data => {
                if (data && data._id) {
                  setUser(prev => {
                    const updated = { ...prev, credits: data.credits };
                    localStorage.setItem('user', JSON.stringify(updated));
                    return updated;
                  });
                }
              });
          }}
        />
      )}
    </div>
  );
}


