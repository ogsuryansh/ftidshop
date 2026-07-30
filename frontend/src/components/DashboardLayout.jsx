import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user ? user.name : 'Unknown';
  const credits = user ? user.credits : 0;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
            
            <Link to="/" className="brand_logo" style={{ textDecoration: 'none' }}>
              <span className="logo_brand">FTID</span><span className="logo_accent">.SHOP</span>
            </Link>
          </div>

          <div className="topbar_right">
            <div className="wallet_badge">
              <i className='bx bx-wallet'></i> <span>${credits}</span>
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
    </div>
  );
}

