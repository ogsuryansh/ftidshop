import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_SITE_KEY = '0x4AAAAAAFb0ySx4rhyVgHkM';

export default function CloudflareCaptcha({ onVerify, siteKey = DEFAULT_SITE_KEY }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up previous instance if any
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          callback: (token) => {
            if (isMounted && onVerify) {
              onVerify(token);
            }
          },
          'expired-callback': () => {
            if (isMounted && onVerify) {
              onVerify(null);
            }
          },
          'error-callback': (code) => {
            console.error('[Cloudflare Turnstile] Error code:', code);
            if (isMounted) setLoadError(true);
          }
        });
      } catch (err) {
        console.error('[Cloudflare Turnstile] Render error:', err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Check if script exists or inject it
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted && window.turnstile) renderWidget();
        };
        script.onerror = () => {
          if (isMounted) setLoadError(true);
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '10px 0 16px 0' }}>
      <div
        ref={containerRef}
        style={{
          minHeight: '65px',
          minWidth: '300px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
      {loadError && (
        <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
          Security check failed to load. Please check your network connection.
        </span>
      )}
    </div>
  );
}
