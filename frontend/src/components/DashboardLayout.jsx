import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user ? user.name : 'Unknown';
  const credits = user ? user.credits : 0;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#141617' }}>
      {/* Sidebar */}
      <div className="dashboard-sidebar" style={{ width: '250px', backgroundColor: '#1c1e1f', padding: '30px 20px', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: '30px', boxSizing: 'border-box' }}>
        
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '15px', color: '#fff' }}>My account</div>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00f2fe', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bxs-grid-alt'></i> Profile settings
          </Link>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '15px', color: '#fff' }}>FTID</div>
          <Link to="/dashboard/ftid/submit" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-plus-circle'></i> Submit order
          </Link>
          <Link to="/dashboard/ftid/orders" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-cart'></i> My orders
          </Link>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '15px', color: '#fff' }}>Receipts</div>
          <Link to="/dashboard/receipts/submit" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-receipt'></i> Submit order
          </Link>
          <Link to="/dashboard/receipts/orders" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-history'></i> My orders
          </Link>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '15px', color: '#fff' }}>Partners</div>
          <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bxl-sketch'></i> Playboy.gd
          </Link>
          <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-send'></i> Voided.to
          </Link>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '15px', color: '#fff' }}>Help</div>
          <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-chat'></i> Community chat
          </Link>
          <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-news'></i> FTID.SHOP news
          </Link>
          <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999', fontSize: '14px', textDecoration: 'none', padding: '5px 0' }}>
            <i className='bx bx-question-mark'></i> FAQ
          </Link>
        </div>

      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
        {/* Topbar */}
        <div className="dashboard-topbar" style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo text_4xlarge weight_bold transform_uppercase" style={{ textDecoration: 'none' }}>
              <span className="inline_block vmiddle color_secondary">FTID</span><span className="inline_block vmiddle stroked_text">.SHOP</span>
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}><i className='bx bx-wallet'></i> ${credits}</div>
            <div style={{ color: '#fff', fontSize: '14px' }}>{username}</div>
          </div>
        </div>

        <div style={{ padding: '20px 40px', flex: 1, boxSizing: 'border-box' }} className="bg_primary dashboard-content">
            {/* Banner */}
            <div style={{ backgroundColor: '#1c1e1f', padding: '8px 0', borderRadius: '8px', marginBottom: '30px', overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                <marquee scrollamount="5" style={{ fontSize: '15px', fontWeight: '500', letterSpacing: '0.5px', color: '#ff4d4d' }}>
                    ⚠️ <strong style={{ color: '#ff4d4d' }}>NOTICE:</strong> Our new Telegram account for support is <strong>@support</strong> &nbsp;|&nbsp; Join our new update channel by clicking <a href="https://t.me/+_K7FLYiIzP41MzJi" style={{ color: '#ff4d4d', textDecoration: 'underline' }}>here</a>
                </marquee>
            </div>

            <Outlet />
        </div>
      </div>
    </div>
  );
}
