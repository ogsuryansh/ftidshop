import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || 'Password reset link sent to your email.');
      } else {
        setError(data.error || 'Failed to send reset link.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        width: '100%', maxWidth: '400px', padding: '40px 30px', 
        backgroundColor: '#12151a', borderRadius: '16px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
        border: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>Forgot Password</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>Enter your email address to receive a password reset link.</p>
        </div>

        {message && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="name@example.com"
              style={{ 
                width: '100%', padding: '14px', borderRadius: '8px', 
                backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', outline: 'none', boxSizing: 'border-box' 
              }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '14px', borderRadius: '8px', border: 'none', 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
              color: '#fff', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', 
              fontSize: '15px', marginTop: '10px', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
