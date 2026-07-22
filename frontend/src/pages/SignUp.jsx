import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const LoadingCaptcha = ({ onVerify }) => {
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const handleClick = () => {
    if (status !== 'idle') return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      onVerify('fake_cloudflare_token_' + Date.now());
    }, 1500);
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '10px 15px', 
        backgroundColor: '#222', 
        border: '1px solid #444', 
        borderRadius: '8px',
        cursor: status === 'idle' ? 'pointer' : 'default',
        width: '300px',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          width: '24px', 
          height: '24px', 
          borderRadius: '4px',
          border: status === 'success' ? 'none' : '2px solid #555',
          backgroundColor: status === 'success' ? '#28a745' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {status === 'loading' && (
            <div style={{
              width: '14px', height: '14px', border: '2px solid transparent',
              borderTopColor: '#007bff', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
          )}
          {status === 'success' && (
            <i className='bx bx-check' style={{ color: '#fff', fontSize: '18px' }}></i>
          )}
        </div>
        <span style={{ color: '#ccc', fontSize: '14px' }}>Verify you are human</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <i className='bx bxl-cloudflare' style={{ color: '#f38020', fontSize: '20px' }}></i>
        <span style={{ fontSize: '9px', color: '#666' }}>Privacy - Terms</span>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default function SignUp() {
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!captchaToken) {
      alert("Please complete the security check.");
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              name,
              email,
              password,
              captchaToken
          })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert('Error: ' + data.error);
        setCaptchaToken(null); // reset captcha on failure
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  return (
    <div className="container pt_12 pb_12" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg_secondary radius_medium p_6" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="align_center text_xlarge mb_2">Sign up</h2>
        <div className="align_center mb_6 text_small color_neutral">
          Already have an account ? <Link to="/login" className="color_secondary">Sign in</Link>
        </div>
        
        <form onSubmit={handleRegister}>
          <div className="mb_4">
            <label className="block mb_2 text_small">Name</label>
            <input 
              type="text" 
              value={name} onChange={e => setName(e.target.value)} required
              className="width_full p_3 radius_medium bg_primary color_primary" 
              style={{ border: '1px solid #333', outline: 'none' }} 
            />
          </div>
          <div className="mb_4">
            <label className="block mb_2 text_small">Email</label>
            <input 
              type="email" 
              value={email} onChange={e => setEmail(e.target.value)} required
              className="width_full p_3 radius_medium bg_primary color_primary" 
              style={{ border: '1px solid #333', outline: 'none' }} 
            />
          </div>
          <div className="mb_4">
            <label className="block mb_2 text_small">Password</label>
            <input 
              type="password" 
              value={password} onChange={e => setPassword(e.target.value)} required
              className="width_full p_3 radius_medium bg_primary color_primary" 
              style={{ border: '1px solid #333', outline: 'none' }} 
            />
          </div>
          <div className="mb_6">
            <label className="block mb_2 text_small">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              className="width_full p_3 radius_medium bg_primary color_primary" 
              style={{ border: '1px solid #333', outline: 'none' }} 
            />
          </div>

          {!captchaToken ? (
            <LoadingCaptcha onVerify={(token) => setCaptchaToken(token)} />
          ) : (
            <div style={{ marginBottom: '20px', color: '#28a745', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className='bx bx-check-circle'></i> Verification complete
            </div>
          )}
          
          <button type="submit" className="button_solid width_full p_3 radius_medium weight_bold" style={{ border: 'none', cursor: 'pointer' }}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
