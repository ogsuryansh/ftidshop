import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode: requires2FA ? twoFactorCode : undefined })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        }
      } else {
        setErrorMsg(data.error || 'Login failed');
      }
    } catch (err) {
      setErrorMsg('Login failed. Ensure backend server is running.');
    }
  };

  return (
    <div className="container pt_12 pb_12" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg_secondary radius_medium p_6" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="align_center text_xlarge mb_2">Sign in</h2>
        <div className="align_center mb_6 text_small color_neutral">
          Don't have an account ? <Link to="/register" className="color_secondary">Sign up</Link>
        </div>

        {errorMsg && (
          <div style={{ color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          {!requires2FA ? (
            <>
              <div className="mb_4">
                <label className="block mb_2 text_small">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
              
              <button type="submit" className="button_solid width_full p_3 radius_medium weight_bold" style={{ border: 'none', cursor: 'pointer' }}>
                Login
              </button>
            </>
          ) : (
            <>
              <div className="mb_6" style={{ textAlign: 'center' }}>
                <i className='bx bx-shield-quarter' style={{ fontSize: '48px', color: '#00f2fe', marginBottom: '10px' }}></i>
                <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Two-Factor Security Verification</h4>
                <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Enter the 6-digit code from Google Authenticator / Authy app</p>
                
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '14px', background: '#12151b', border: '1px solid #00f2fe', borderRadius: '8px', color: '#fff', fontSize: '20px', textAlign: 'center', letterSpacing: '6px', outline: 'none', marginTop: '16px', boxSizing: 'border-box' }} 
                />
              </div>

              <button type="submit" className="button_solid width_full p_3 radius_medium weight_bold" style={{ border: 'none', cursor: 'pointer' }}>
                Verify & Login
              </button>

              <button 
                type="button" 
                onClick={() => setRequires2FA(false)} 
                style={{ background: 'transparent', border: 'none', color: '#888', width: '100%', marginTop: '12px', fontSize: '13px', cursor: 'pointer' }}
              >
                &larr; Back to Email & Password
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
