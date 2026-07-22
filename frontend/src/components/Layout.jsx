import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <div className="bg_tertiary" style={{ padding: '8px 0', borderBottom: '1px solid #2a2a2a', overflow: 'hidden' }}>
          <marquee scrollamount="5" style={{ fontSize: '15px', fontWeight: '500', letterSpacing: '0.5px', color: '#ff4d4d' }}>
              ⚠️ <strong style={{ color: '#ff4d4d' }}>NOTICE:</strong> Our new Telegram account for support is <strong>@support</strong> &nbsp;|&nbsp; Join our new update channel by clicking <a href="https://t.me/+_K7FLYiIzP41MzJi" style={{ color: '#ff4d4d', textDecoration: 'underline' }}>here</a>
          </marquee>
      </div>

      <header className="pt_8 pb_8 pl_4 pr_4">
          <div className="container flex_container flex_persistent">
              <Link to="/" className="logo text_4xlarge weight_bold transform_uppercase">
                  <span className="inline_block vmiddle color_secondary">FTID</span><span className="inline_block vmiddle stroked_text">.SHOP</span>
              </Link>
              <nav className="navigation flex_full pl_4 ml_4"></nav>
              <div className="welcomeblock align_right">
                  <Link to="/login" className="button pl_4 pr_4 pt_2 pb_2 m_1 radius_large button_solid"><span>Sign In</span></Link>
                  <Link to="/register" className="button pl_4 pr_4 pt_2 pb_2 m_1 radius_large button_outlined"><span className="theme_text_gradient">Sign Up</span></Link>
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
