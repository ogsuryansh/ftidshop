import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_SITE_KEY = '0x4AAAAAAFb0ySx4rhyVgHkM';

export default function CloudflareCaptcha({ onVerify, siteKey = DEFAULT_SITE_KEY, resetTrigger = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const [loadError, setLoadError] = useState(false);

  // Keep the latest onVerify callback in ref without re-triggering the Turnstile render effect
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  // Handle in-place reset if resetTrigger changes (e.g. on invalid login/register credentials)
  useEffect(() => {
    if (resetTrigger > 0 && widgetIdRef.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (e) {
        console.warn('Turnstile reset error:', e);
      }
    }
  }, [resetTrigger]);

  // Render Turnstile ONCE per component mount (does NOT re-render on parent typing/state changes)
  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) return; // Prevent double-rendering

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          retry: 'auto',
          'refresh-expired': 'auto',
          callback: (token) => {
            if (isMounted && onVerifyRef.current) {
              onVerifyRef.current(token);
            }
          },
          'expired-callback': () => {
            if (isMounted && onVerifyRef.current) {
              onVerifyRef.current(null);
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
        }, 100);
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
  }, [siteKey]); // Only re-run if siteKey changes

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
