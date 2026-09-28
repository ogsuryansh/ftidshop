import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || 'Password reset successfully.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h3>Invalid Password Reset Link</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        width: '100%', maxWidth: '400px', padding: '40px 30px', 
        backgroundColor: '#12151a', borderRadius: '16px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
        border: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>Set New Password</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>Please enter your new password below.</p>
        </div>

        {message && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
            {message} <br/> Redirecting to login...
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ 
                width: '100%', padding: '14px', borderRadius: '8px', 
                backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', outline: 'none', boxSizing: 'border-box' 
              }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              placeholder="••••••••"
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
