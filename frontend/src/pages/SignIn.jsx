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
  const [loginAs, setLoginAs] = useState('Customer');

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '10px' }}>
         <div style={{ width: '40px', height: '40px', backgroundColor: '#8b5cf6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>
            F
         </div>
         <span style={{ color: '#f8fafc', fontSize: '22px', fontWeight: '700' }}>FTID.SHOP</span>
      </div>

      <div style={{ backgroundColor: '#1e293b', width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Inner Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#8b5cf6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '28px', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)' }}>
            F
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Welcome to FTID.SHOP</p>
          <h2 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Welcome back</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Sign in to continue to your customer portal.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#0f172a', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          <div style={{ flex: 1, backgroundColor: '#1e293b', color: '#f8fafc', textAlign: 'center', padding: '10px 0', borderRadius: '8px', fontWeight: '600', fontSize: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            Login
          </div>
          <Link to="/register" style={{ flex: 1, color: '#94a3b8', textAlign: 'center', padding: '10px 0', borderRadius: '8px', fontWeight: '500', fontSize: '14px', textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>

        {errorMsg && (
          <div style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          {!requires2FA ? (
            <>
              {/* Login As */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Login As</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={loginAs}
                    onChange={(e) => setLoginAs(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', appearance: 'none', outline: 'none' }}
                  >
                    <option value="Customer">Customer</option>
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
              
              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>

              {/* Remember me & Forgot Password */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ marginRight: '8px', width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }} />
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Remember me</span>
                </label>
                <a href="#" style={{ color: '#8b5cf6', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</a>
              </div>
              
              {/* Submit Button */}
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#7c3aed'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#8b5cf6'}>
                Login to Portal <span>&rarr;</span>
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', marginBottom: '16px' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 8px 0', fontWeight: '600' }}>Two-Factor Security</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Enter the 6-digit code from Google Authenticator</p>
                
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', outline: 'none', marginTop: '20px', boxSizing: 'border-box', fontWeight: '500' }} 
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#7c3aed'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#8b5cf6'}>
                Verify & Login
              </button>

              <button 
                type="button" 
                onClick={() => setRequires2FA(false)} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', width: '100%', marginTop: '16px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
              >
                &larr; Back to Email
              </button>
            </>
          )}
        </form>


      </div>
    </div>
  );
}
