import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin));
        navigate('/admin/dashboard');
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
        <h2 className="align_center text_xlarge mb_2 color_primary">Admin Login</h2>
        <div className="align_center mb_6 text_small color_neutral">
          Secure Access
        </div>
        
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
          
          <button type="submit" className="button_solid width_full p_3 radius_medium weight_bold" style={{ border: 'none', cursor: 'pointer', backgroundColor: '#e74c3c' }}>
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
}
