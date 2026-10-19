import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import CloudflareCaptcha from '../components/CloudflareCaptcha';

export default function SignUp() {
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [resetKey, setResetKey] = useState(0);

  // If already logged in, automatically proceed to dashboard
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && user !== 'undefined' && user !== 'null') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleVerify = React.useCallback((token) => {
    setCaptchaToken(token);
    if (token) setErrorMsg('');
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    if (!captchaToken) {
      setErrorMsg("Please complete the security check.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, captchaToken })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setErrorMsg(data.error || 'Registration failed');
        setCaptchaToken(null);
        setResetKey(prev => prev + 1);
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
      setCaptchaToken(null);
      setResetKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
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
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Join FTID.SHOP</p>
          <h2 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Create an account</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Sign up to access your customer portal.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#0f172a', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          <Link to="/login" style={{ flex: 1, color: '#94a3b8', textAlign: 'center', padding: '10px 0', borderRadius: '8px', fontWeight: '500', fontSize: '14px', textDecoration: 'none' }}>
            Login
          </Link>
          <div style={{ flex: 1, backgroundColor: '#1e293b', color: '#f8fafc', textAlign: 'center', padding: '10px 0', borderRadius: '8px', fontWeight: '600', fontSize: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            Create Account
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              value={name} onChange={e => setName(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          
          {/* Email Address */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
            <input 
              type="password" 
              placeholder="Create a password"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#f8fafc', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Confirm your password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <CloudflareCaptcha onVerify={handleVerify} resetTrigger={resetKey} />
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background-color 0.2s' }} 
            onMouseOver={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#7c3aed'; }} 
            onMouseOut={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#8b5cf6'; }}
          >
            {isLoading ? 'Processing...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
