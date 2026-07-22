import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Login failed. Ensure backend is running.');
    }
  };

  return (
    <div className="container pt_12 pb_12" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg_secondary radius_medium p_6" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="align_center text_xlarge mb_2">Sign in</h2>
        <div className="align_center mb_6 text_small color_neutral">
          Don't have an account ? <Link to="/register" className="color_secondary">Sign up</Link>
        </div>
        
        <form onSubmit={handleLogin}>
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
        </form>
      </div>
    </div>
  );
}
