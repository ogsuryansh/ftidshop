import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const isLoggedIn = !!(token || userStr);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <>
      <div className="bg_tertiary">
          <div className="align_center pt_2 pb_2 px_4" style={{ fontSize: '13px', lineHeight: '1.5' }}>
              Our new Telegram account for support is <a href="https://t.me/rts_www" target="_blank" rel="noopener noreferrer">@rts_www</a> / Join our new update channel by clicking <a href="https://t.me/+WpoS6AcNJDhkODVl" target="_blank" rel="noopener noreferrer">here</a>
          </div>
      </div>

      <header className="site_header pt_6 pb_6 pl_4 pr_4">
          <div className="container header_flex_container">
              
              {/* Brand Logo */}
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  <img 
                    src="/assets/images/brand_logo.png" 
                    alt="FTID.SHOP - FAST. RELIABLE. WORLDWIDE." 
                    className="brand_logo_img"
                    style={{ height: '46px', width: 'auto', display: 'block', objectFit: 'contain' }} 
                  />
              </Link>

              {/* Header Actions */}
              <div className="welcomeblock" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {isLoggedIn ? (
                    <>
                      <Link to="/dashboard" className="button pl_4 pr_4 pt_2 pb_2 m_1 radius_large button_solid"><span>Dashboard</span></Link>
                      <button onClick={handleSignOut} className="button pl_4 pr_4 pt_2 pb_2 m_1 radius_large button_outlined" style={{ cursor: 'pointer', background: 'transparent' }}><span className="theme_text_gradient">Sign Out</span></button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="button pl_4 pr_4 pt_2 pb_2 m_1 radius_large button_solid"><span>Sign In</span></Link>
                      <Link to="/register" className="button pl_4 pr_4 pt_2 pb_2 m_1 radius_large button_outlined"><span className="theme_text_gradient">Sign Up</span></Link>
                    </>
                  )}
              </div>
          </div>
      </header>

      <Outlet />

      <footer className="pt_12">
          <div className="container pt_6 pb_6">
              <div className="align_center" style={{ marginBottom: '8px' }}>
                  <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    <img src="/assets/images/brand_logo.png" alt="FTID.SHOP" style={{ height: '36px', width: 'auto', display: 'block', margin: '0 auto' }} />
                  </Link>
              </div>
              <div className="text_small align_center">
                  FTID.SHOP &copy; All rights reserved.
              </div>
          </div>
      </footer>
      <div className="sticky_buttons">
          <a href="https://t.me/+WpoS6AcNJDhkODVl" target="_blank" rel="noopener noreferrer"><img src="/assets/images/telegram_icon.jpg" alt="Telegram" /></a>
      </div>
    </>
  );
}



