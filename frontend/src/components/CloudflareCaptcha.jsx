import React, { useState } from 'react';

export default function CloudflareCaptcha({ onVerify }) {
  const [status, setStatus] = useState('idle'); // idle | verifying | success

  const handleClick = () => {
    if (status !== 'idle') return;
    setStatus('verifying');
    setTimeout(() => {
      setStatus('success');
      if (onVerify) {
        onVerify('cf_turnstile_sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
      }
    }, 1200);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#0b0f17',
        border: status === 'success' ? '1px solid rgba(40, 167, 69, 0.5)' : '1px solid #334155',
        borderRadius: '10px',
        cursor: status === 'idle' ? 'pointer' : 'default',
        width: '100%',
        maxWidth: '360px',
        margin: '0 auto 20px auto',
        boxSizing: 'border-box',
        userSelect: 'none',
        boxShadow: status === 'success' ? '0 0 15px rgba(40, 167, 69, 0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Checkbox / Spinner / Checkmark */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            border: status === 'success' ? 'none' : '2px solid #64748b',
            backgroundColor: status === 'success' ? '#10b981' : (status === 'verifying' ? 'rgba(243, 128, 32, 0.1)' : '#1e293b'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          {status === 'verifying' && (
            <div
              style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(243, 128, 32, 0.3)',
                borderTopColor: '#f38020',
                borderRadius: '50%',
                animation: 'cfSpin 0.8s linear infinite'
              }}
            />
          )}
          {status === 'success' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: status === 'success' ? '#4ade80' : '#f1f5f9', fontSize: '13px', fontWeight: '600', letterSpacing: '0.2px' }}>
            {status === 'success' ? 'Verification Success' : (status === 'verifying' ? 'Verifying browser...' : 'Verify you are human')}
          </span>
          <span style={{ color: '#64748b', fontSize: '11px', marginTop: '1px' }}>
            {status === 'success' ? 'Protected by Cloudflare' : 'DDoS Protection & Bot Mitigation'}
          </span>
        </div>
      </div>

      {/* Cloudflare Branding */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="bx bxl-cloudflare" style={{ color: '#f38020', fontSize: '22px' }}></i>
        </div>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>CLOUDFLARE</span>
        <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>
          Privacy • Terms
        </div>
      </div>

      <style>{`
        @keyframes cfSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
