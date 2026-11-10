import React, { useEffect, useRef, useState } from 'react';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';

export default function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
  const buttonContainerRef = useRef(null);
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    const initializeGoogleButton = (clientId) => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Clear existing button to avoid duplicate if re-rendered
        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
        }

        const btnWidth = Math.min(380, window.innerWidth > 440 ? 380 : Math.max(240, window.innerWidth - 60));

        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: 'outline',
          size: 'large',
          text: text,
          shape: 'pill',
          width: btnWidth,
          logo_alignment: 'left',
        });
      } catch (e) {
        console.error('Google accounts initialize failed:', e);
      }
    };

    const loadConfigAndScript = async () => {
      let clientId = googleClientId;
      if (!clientId) {
        try {
          const cfg = await authService.getAuthConfig();
          if (cfg?.googleClientId) {
            clientId = cfg.googleClientId;
            if (isMounted) setGoogleClientId(clientId);
          }
        } catch (err) {
          console.warn('Could not fetch backend auth config:', err);
        }
      }

      if (!clientId) {
        if (isMounted) setConfigured(false);
        return;
      }

      if (isMounted) setConfigured(true);

      const renderIfReady = () => {
        if (isMounted && window.google?.accounts?.id && buttonContainerRef.current) {
          initializeGoogleButton(clientId);
          return true;
        }
        return false;
      };

      if (!renderIfReady()) {
        // Ensure script tag exists in head
        let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
        script.addEventListener('load', renderIfReady);

        // Polling fallback
        let attempts = 0;
        pollInterval = setInterval(() => {
          attempts++;
          if (renderIfReady() || attempts > 25) {
            clearInterval(pollInterval);
          }
        }, 150);
      }
    };

    loadConfigAndScript();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [googleClientId, text]);

  const handleCredentialResponse = async (response) => {
    if (!response.credential) {
      if (onError) onError('No credential token received from Google.');
      return;
    }

    setLoading(true);
    try {
      await onSuccess(response.credential);
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Google sign-in verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div ref={buttonContainerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />

      {!configured && (
        <div style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--sage-light)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--charcoal)',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          <span>
            🎓 <strong>Google College Sign-In:</strong> Ready for integration. Provide <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> to activate Google Identity Services.
          </span>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="spin" /> Verifying Google token with backend...
        </div>
      )}
    </div>
  );
}
