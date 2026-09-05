import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [adminId, setAdminId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      setLoading(false);
      
      if (res.ok) {
        if (data.step === '2FA_REQUIRED') {
          setAdminId(data.adminId);
          setStep(2);
        } else if (data.token) {
          // Fallback if 2FA wasn't required (not expected with current backend logic, but safe)
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('admin', JSON.stringify(data.admin || {}));
          navigate('/admin/dashboard');
        }
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      setLoading(false);
      alert('Login failed. Ensure backend is running.');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, otp })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin || {}));
        navigate('/admin/dashboard');
      } else {
        alert(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setLoading(false);
      alert('Verification failed. Ensure backend is running.');
    }
  };

  return (
    <div className="container pt_12 pb_12" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg_secondary radius_medium p_6" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="align_center text_xlarge mb_2 color_primary">Admin Login</h2>
        <div className="align_center mb_6 text_small color_neutral">
          {step === 1 ? 'Secure Access' : '2-Step Verification'}
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleLogin}>
            <div className="mb_4">
              <label className="block mb_2 text_small">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="width_full p_3 radius_medium bg_primary color_primary" 
                style={{ border: '1px solid #333', outline: 'none' }} 
              />
            </div>
            <div className="mb_6">
              <label className="block mb_2 text_small">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="width_full p_3 radius_medium bg_primary color_primary" 
                style={{ border: '1px solid #333', outline: 'none' }} 
              />
            </div>
            
            <button type="submit" disabled={loading} className="button_solid width_full p_3 radius_medium weight_bold" style={{ border: 'none', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: '#e74c3c' }}>
              {loading ? 'Processing...' : 'Login as Admin'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA}>
            <div className="mb_6">
              <label className="block mb_2 text_small">6-Digit Code</label>
              <p className="text_small color_neutral mb_4">We've sent a 6-digit code to your admin email address. Please enter it below.</p>
              <input 
                type="text" 
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                placeholder="123456"
                maxLength="6"
                className="width_full p_3 radius_medium bg_primary color_primary align_center text_large tracking_widest" 
                style={{ border: '1px solid #333', outline: 'none', letterSpacing: '0.2em' }} 
              />
            </div>
            
            <button type="submit" disabled={loading} className="button_solid width_full p_3 radius_medium weight_bold mb_4" style={{ border: 'none', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: '#2ecc71' }}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button type="button" onClick={() => setStep(1)} className="button_outline width_full p_3 radius_medium weight_bold color_primary" style={{ border: '1px solid #333', cursor: 'pointer', backgroundColor: 'transparent' }}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
