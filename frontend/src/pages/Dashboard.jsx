import React, { useState } from 'react';

export default function Dashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user ? user.name : 'Unknown';
  const email = user ? user.email : 'unknown@domain.com';
  const credits = user ? user.credits : 0;
  const joinedDate = user && user.joined ? new Date(user.joined).toLocaleString() : 'N/A';

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="dashboard_card_panel">
      {/* Header Banner */}
      <div className="profile_header_card">
        <div className="profile_avatar_lg">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="profile_info_header">
          <div className="profile_user_title">
            <h3>{username}</h3>
            <span className="user_role_badge"><i className='bx bxs-badge-check'></i> Verified Member</span>
          </div>
          <p className="profile_email_sub">{email}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard_tab_bar">
        <button 
          className={`tab_btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className='bx bx-user'></i> Profile Settings
        </button>
        <button 
          className={`tab_btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <i className='bx bx-shield-quarter'></i> Security & 2FA
        </button>
        <button 
          className={`tab_btn ${activeTab === 'deposits' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          <i className='bx bx-wallet'></i> Wallet & Credits
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'profile' && (
        <div className="tab_panel_content">
          <div className="details_grid">
            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-user-circle'></i> Username</div>
              <div className="detail_value">{username}</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-envelope'></i> Email Address</div>
              <div className="detail_value">{email}</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-calendar-event'></i> Account Created</div>
              <div className="detail_value">{joinedDate}</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-wallet-alt'></i> Available Balance</div>
              <div className="detail_value text_gradient_val">${credits} USD</div>
            </div>

            <div className="detail_item">
              <div className="detail_label"><i className='bx bx-lock-alt'></i> Two-Factor Auth</div>
              <div className="detail_value">
                <span className="status_pill pill_danger"><i className='bx bx-x-circle'></i> Disabled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="tab_panel_content">
          <div className="security_box">
            <h4>Two-Factor Authentication (2FA)</h4>
            <p>Protect your FTID.SHOP account with an extra layer of security using Google Authenticator or Authy.</p>
            <button className="btn_action_primary">
              <i className='bx bx-shield-plus'></i> Enable 2FA Security
            </button>
          </div>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="tab_panel_content">
          <div className="credits_box">
            <div className="balance_card">
              <span className="balance_title">Current Balance</span>
              <div className="balance_amount">${credits}</div>
            </div>
            <p>Credits can be used to place instant orders for FTID and Receipts.</p>
          </div>
        </div>
      )}
    </div>
  );
}

