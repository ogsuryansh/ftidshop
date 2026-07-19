import React from 'react';

export default function Dashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user ? user.name : 'Unknown';
  const email = user ? user.email : 'unknown@domain.com';
  const credits = user ? user.credits : 0;
  const joinedDate = user && user.joined ? new Date(user.joined).toLocaleString() : 'N/A';

  return (
    <div className="bg_secondary" style={{ borderRadius: '12px', padding: '40px' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '30px', fontWeight: '500', color: '#fff' }}>Profile overview</h2>
        
        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
            <div style={{ color: '#c38d5e', cursor: 'pointer', fontSize: '14px' }}>Profile settings</div>
            <div style={{ color: '#999', cursor: 'pointer', fontSize: '14px' }}>Change password</div>
            <div style={{ color: '#999', cursor: 'pointer', fontSize: '14px' }}>Change email</div>
            <div style={{ color: '#999', cursor: 'pointer', fontSize: '14px' }}>2FA</div>
            <div style={{ color: '#999', cursor: 'pointer', fontSize: '14px' }}>Deposits</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '200px', color: '#999', fontSize: '14px' }}>Username:</div>
                <div style={{ color: '#fff', fontSize: '14px' }}>{username}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '200px', color: '#999', fontSize: '14px' }}>Joined:</div>
                <div style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>{joinedDate} <i className='bx bx-calendar'></i></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '200px', color: '#999', fontSize: '14px' }}>Email:</div>
                <div style={{ color: '#fff', fontSize: '14px' }}>{email}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '200px', color: '#999', fontSize: '14px' }}>2FA:</div>
                <div style={{ backgroundColor: '#a94442', color: '#fff', padding: '6px 15px', borderRadius: '6px', fontSize: '13px' }}>Disabled</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '200px', color: '#999', fontSize: '14px' }}>Credits:</div>
                <div style={{ color: '#fff', fontSize: '14px' }}>${credits}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '200px', color: '#999', fontSize: '14px' }}>Delete account:</div>
                <div style={{ backgroundColor: '#a94442', color: '#fff', padding: '6px 15px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Delete account</div>
            </div>
        </div>
    </div>
  );
}
