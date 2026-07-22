import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const isLoggedIn = !!(token || userStr);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <>
      <div className="bg_tertiary">
          <div className="align_center pt_2 pb_2">
              Our new Telegram account for support is @support / Join our new update channel by clicking <a href="https://t.me/+_K7FLYiIzP41MzJi">here</a>
          </div>
      </div>

      <header className="pt_8 pb_8 pl_4 pr_4" style={{ position: 'relative', zIndex: 100 }}>
          <div className="container flex_container flex_persistent items_center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Link to="/" className="logo text_4xlarge weight_bold transform_uppercase" style={{ textDecoration: 'none' }}>
                  <span className="inline_block vmiddle color_secondary">FTID</span><span className="inline_block vmiddle stroked_text">.SHOP</span>
              </Link>
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
              <div className="align_center">
                  <span className="text_large logo theme_text_gradient weight_semibold">FTID.SHOP</span>
              </div>
              <div className="text_small align_center">
                  FTID.SHOP &copy; All rights reserved.
              </div>
          </div>
      </footer>
      <div className="sticky_buttons">
          <a href="https://t.me/+_K7FLYiIzP41MzJi" target="_blank" rel="noreferrer"><img src="/assets/images/telegram_icon.jpg" alt="Telegram" /></a>
          <a href="https://signal.group/#CjQKIJA5mtLKFm1j9utMG3mKT9CKFykstLW4IxbG76jBKuH_EhCNjf3qLEbisZ8Fr71s8uVd" target="_blank" rel="noreferrer"><img src="/assets/images/signal_icon.svg" alt="Signal" /></a>
      </div>
    </>
  );
}
