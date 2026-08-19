import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import DepositModal from './DepositModal';

export default function DashboardLayout() {
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  });
  const username = user ? user.name : 'Unknown';
  const credits = user ? user.credits : 0;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    const handleUserUpdated = () => {
      const userStr = localStorage.getItem('user');
      setUser(userStr && userStr !== "undefined" ? JSON.parse(userStr) : null);
    };
    window.addEventListener('user-updated', handleUserUpdated);
    return () => window.removeEventListener('user-updated', handleUserUpdated);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard_app_wrapper">
      {/* Topbar */}
      <header className="dashboard_topbar">
        <div className="topbar_inner">
          <div className="topbar_left">
            <button 
              className="sidebar_toggle_btn" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle Navigation"
            >
              <i className={`bx ${mobileSidebarOpen ? 'bx-x' : 'bx-menu-alt-left'}`}></i>
            </button>
            
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              <img 
                src="/assets/images/brand_logo.png" 
                alt="FTID.SHOP" 
                className="brand_logo_img"
                style={{ height: '38px', width: 'auto', display: 'block', objectFit: 'contain' }} 
              />
            </Link>
          </div>

          <div className="topbar_right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="wallet_badge">
                <i className='bx bx-wallet'></i> <span>${credits}</span>
              </div>
              <button
                onClick={() => setShowDepositModal(true)}
                title="Deposit Funds"
                style={{ 
                  background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  fontSize: '20px',
                  boxShadow: '0 2px 8px rgba(0,242,254,0.4)'
                }}>
                <i className='bx bx-plus'></i>
              </button>
            </div>
            <div className="user_profile_pill">
              <div className="user_avatar">{username.charAt(0).toUpperCase()}</div>
              <span className="user_name">{username}</span>
            </div>
            <button onClick={handleSignOut} className="btn_signout" title="Sign Out">
              <i className='bx bx-log-out'></i>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard_body">
        {/* Sidebar */}
        <aside className={`dashboard_sidebar ${mobileSidebarOpen ? 'mobile_open' : ''}`}>
          <div className="sidebar_group">
            <div className="sidebar_group_title">MY ACCOUNT</div>
            <NavLink 
              to="/dashboard" 
              end
              className={({ isActive }) => `sidebar_link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <i className='bx bxs-user-detail'></i> <span>Profile Settings</span>
            </NavLink>
          </div>

          <div className="sidebar_group">
            <div className="sidebar_group_title">FTID SERVICES</div>
            <NavLink 
              to="/dashboard/ftid/submit" 
              className={({ isActive }) => `sidebar_link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <i className='bx bx-plus-circle'></i> <span>Submit Order</span>
            </NavLink>
            <NavLink 
              to="/dashboard/ftid/orders" 
              className={({ isActive }) => `sidebar_link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <i className='bx bx-package'></i> <span>My Orders</span>
            </NavLink>
          </div>

          <div className="sidebar_group">
            <div className="sidebar_group_title">RECEIPT SERVICES</div>
            <NavLink 
              to="/dashboard/receipts/submit" 
              className={({ isActive }) => `sidebar_link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <i className='bx bx-receipt'></i> <span>Submit Receipt</span>
            </NavLink>
            <NavLink 
              to="/dashboard/receipts/orders" 
              className={({ isActive }) => `sidebar_link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <i className='bx bx-history'></i> <span>My Receipts</span>
            </NavLink>
          </div>

          <div className="sidebar_group">
            <div className="sidebar_group_title">HELP & SUPPORT</div>
            <a href="https://t.me/+CaAi1_Ps4mE3NjZh" target="_blank" rel="noopener noreferrer" className="sidebar_link">
              <i className='bx bx-chat'></i> <span>Community Chat</span> <i className='bx bx-link-external link_icon'></i>
            </a>
            <a href="https://t.me/+WpoS6AcNJDhkODVl" target="_blank" rel="noopener noreferrer" className="sidebar_link">
              <i className='bx bx-news'></i> <span>News Channel</span> <i className='bx bx-link-external link_icon'></i>
            </a>
            <a href="https://t.me/rts_www" target="_blank" rel="noopener noreferrer" className="sidebar_link">
              <i className='bx bx-support'></i> <span>Support (@rts_www)</span> <i className='bx bx-link-external link_icon'></i>
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard_main_content">
          {/* Top Announcement Alert */}
          <div className="dashboard_announcement_banner">
            <i className='bx bxs-bell-ring banner_icon'></i>
            <span>
              <strong>NOTICE:</strong> Support is available at <a href="https://t.me/rts_www" target="_blank" rel="noopener noreferrer">@rts_www</a> &nbsp;|&nbsp; Join official channel <a href="https://t.me/+WpoS6AcNJDhkODVl" target="_blank" rel="noopener noreferrer">Here <i className='bx bx-right-arrow-alt'></i></a>
            </span>
          </div>

          <Outlet />
        </main>
      </div>

      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} />}
    </div>
  );
}

